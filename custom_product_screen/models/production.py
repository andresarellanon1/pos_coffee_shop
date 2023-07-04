from odoo import models, fields, api
from odoo.exceptions import ValidationError


class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    def mark_as_done(self, id):
        production = self.env['mrp.production'].search([('id', '=', id)])
        production.qty_producing = 1
        production._set_qty_producing()
        resultado = production.button_mark_done()
        return True

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
