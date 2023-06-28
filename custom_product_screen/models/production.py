from odoo import models, fields, api
from odoo.exceptions import ValidationError


class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    def mark_as_done(self, id):
        print("marking as done")
        production = self.env['mrp.production'].search([('id', '=', id)])
        self = self.with_context(production=production)
        self._button_mark_done_sanity_checks()
        if not self.env.context.get('button_mark_done_production_ids'):
            self = self.with_context(button_mark_done_production_ids=self.ids)
        res = self._pre_button_mark_done()
        if res is not True:
            return res

        if self.env.context.get('mo_ids_to_backorder'):
            productions_to_backorder = self.browse(
                self.env.context['mo_ids_to_backorder'])
            productions_not_to_backorder = self - productions_to_backorder
        else:
            productions_not_to_backorder = self
            productions_to_backorder = self.env['mrp.production']

        self.workorder_ids.button_finish()

        backorders = productions_to_backorder and productions_to_backorder._split_productions()
        backorders = backorders - productions_to_backorder

        productions_not_to_backorder._post_inventory(cancel_backorder=True)
        productions_to_backorder._post_inventory(cancel_backorder=True)

        # if completed products make other confirmed/partially_available moves available, assign them
        done_move_finished_ids = (productions_to_backorder.move_finished_ids |
                                  productions_not_to_backorder.move_finished_ids).filtered(lambda m: m.state == 'done')
        done_move_finished_ids._trigger_assign()

        # Moves without quantity done are not posted => set them as done instead of canceling. In
        # case the user edits the MO later on and sets some consumed quantity on those, we do not
        # want the move lines to be canceled.
        (productions_not_to_backorder.move_raw_ids | productions_not_to_backorder.move_finished_ids).filtered(lambda x: x.state not in ('done', 'cancel')).write({
            'state': 'done',
            'product_uom_qty': 0.0,
        })
        for production in self:
            production.write({
                'date_finished': fields.Datetime.now(),
                'product_qty': production.qty_produced,
                'priority': '0',
                'is_locked': True,
                'state': 'done',
            })

        if not backorders:
            if self.env.context.get('from_workorder'):
                return {
                    'type': 'ir.actions.act_window',
                    'res_model': 'mrp.production',
                    'views': [[self.env.ref('mrp.mrp_production_form_view').id, 'form']],
                    'res_id': self.id,
                    'target': 'main',
                }
            if self.user_has_groups('mrp.group_mrp_reception_report') and self.picking_type_id.auto_show_reception_report:
                lines = self.move_finished_ids.filtered(
                    lambda m: m.product_id.type == 'product' and m.state != 'cancel' and m.quantity_done and not m.move_dest_ids)
                if lines:
                    if any(mo.show_allocation for mo in self):
                        action = self.action_view_reception_report()
                        return action
            return True
        context = self.env.context.copy()
        context = {k: v for k, v in context.items(
        ) if not k.startswith('default_')}
        for k, v in context.items():
            if k.startswith('skip_'):
                context[k] = False

        return True

    def button_mark_done(self):

    def create_single_from_list(self, products):
        if not products:
            return
        for prod in products:
            if not self.env['product.product'].browse(int(prod['id'])).pos_production:
                break
            # NOTE: for the coffeshop use case
            # each mrp.production(manufacturingorde) should be created for each individual product, meaning only prod[qty] == 1 allowed
            # make sure to send the products 1 by 1 from the POS javascript files
            # and to not merge theorderlines in the pos live data
            if not prod['qty'] == 1:
                break
            # NOTE: do not remove this block to define the bom
            # it looks time consuming to justify wheter or not to discriminate mrp.bom(s) without product_id
            # NOTE: ps by default it will give priority to bom_prod
            bom_count = self.env['mrp.bom'].search(
                [('product_tmpl_id', '=', prod['product_tmpl_id'])])
            if bom_count:
                bom_temp = self.env['mrp.bom'].search(
                    [('product_tmpl_id', '=', prod['product_tmpl_id']), ('product_id', '=', False)])
                bom_prod = self.env['mrp.bom'].search(
                    [('product_id', '=', prod['id'])])
            if bom_prod:
                bom = bom_prod[0]  # priority
            elif bom_temp:
                bom = bom_temp[0]
            else:
                bom = []
            if not bom:
                break
            vals = {
                'origin': 'POS-' + prod['pos_reference'],
                'state': 'confirmed',
                'product_id': prod['id'],
                'product_tmpl_id': prod['product_tmpl_id'],
                'product_uom_id': prod['uom_id'],
                'product_qty': prod['qty'],
                'bom_id': bom.id,
            }
            mrp_order = self.sudo().create(vals)
            components = []
            for bom_line in mrp_order.bom_id.bom_line_ids:
                print("--- bom line ---")
                bom_line_qty = bom_line.product_qty  # default qty of BoM
                _prodComp = list(filter(lambda n: n['id'] == bom_line.product_id.id, list(
                    prod['components'])))  # check if bom_line is in components
                if len(_prodComp) > 0:
                    print("found component bom line")
                    bom_line_qty = _prodComp[0]['qty']
                print(bom_line)
                print(bom_line_qty)
                components.append((0, 0, {
                    'raw_material_production_id': mrp_order.id,
                    'name': mrp_order.name,
                    'product_id': bom_line.product_id.id,
                    'product_uom': bom_line.product_uom_id.id,
                    'product_uom_qty': bom_line_qty,
                    'picking_type_id': mrp_order.picking_type_id.id,
                    'location_id': mrp_order.location_src_id.id,
                    'location_dest_id': bom_line.product_id.with_company(self.company_id.id).property_stock_production.id,
                    'company_id': mrp_order.company_id.id,
                }))
            mrp_production = {
                'product_id': prod['id'],
                'product_uom_qty': prod['qty'],
                'product_uom': prod['uom_id'],
                'name': mrp_order.name,
                'date_deadline': mrp_order.date_deadline,
                'picking_type_id': mrp_order.picking_type_id.id,
                'location_id': mrp_order.location_src_id.id,
                'location_dest_id': mrp_order.location_dest_id.id,
                'company_id': mrp_order.company_id.id,
                'production_id': mrp_order.id,
                'warehouse_id': mrp_order.location_dest_id.warehouse_id.id,
                'origin': mrp_order.name,
                'group_id': mrp_order.procurement_group_id.id,
                'propagate_cancel': mrp_order.propagate_cancel,
            }
            mrp_order.update({
                'move_raw_ids': components,
                'move_finished_ids': [(0, 0, mrp_production)]
            })
        return True


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    pos_production = fields.Boolean(string='POS Manufacture',
                                    help="Check if the product should be manufactured when sold in POS")

    @ api.onchange('pos_production')
    def onchange_pos_production(self):
        if self.pos_production:
            if not self.bom_count:
                raise ValidationError(
                    'Required Bill of Material for this product.')


class ProductProduct(models.Model):
    _inherit = 'product.product'

    @ api.onchange('pos_production')
    def onchange_pos_production(self):
        if self.pos_production:
            if not self.bom_count:
                raise Warning('Required Bill of Material for this product.')
