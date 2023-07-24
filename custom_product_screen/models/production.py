from odoo import models, fields, api
from odoo.exceptions import ValidationError
import logging
logger = logging.getLogger(__name__)

class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    def mark_as_done(self, id):
        production = self.env['mrp.production'].search([('id', '=', id)])
        production.qty_producing = 1
        production._set_qty_producing()
        production.button_mark_done()
        return True

    def confirm_single(self, product_payload):
        if not self.env['product.product'].browse(int(product_payload['id'])).pos_production:
            return
        mrp_order = self.env['mrp.production'].search(
            [('id', '=', product_payload['production_id'])])
        mrp_order.update({
            'state': 'progress'})
        return

    def create_single(self, product_payload):
        if not self.env['product.product'].browse(int(product_payload['id'])).pos_production:
            return
        if not product_payload['qty'] == 1:
            return
        bom = self.env['mrp.bom'].search(
                [('product_tmpl_id', '=', product_payload['product_tmpl_id']), ('product_id', '=', False)])
        if not bom:
            return
        vals = {
            'origin': 'POS-' + product_payload['pos_reference'],
            'state': 'confirmed',
            'product_id': product_payload['id'],
            'product_tmpl_id': product_payload['product_tmpl_id'],
            'product_uom_id': product_payload['uom_id'],
            'product_qty': product_payload['qty'],
            'bom_id': bom.id,
        }
        mrp_order = self.sudo().create(vals)
        components = []
        for bom_line in mrp_order.bom_id.bom_line_ids:
            # default qty of BoM
            bom_line_qty = bom_line.product_qty
            # check if bom_line is in components, if so allow flexible consuming
            _prodComp = list(filter(lambda n: n['id'] == bom_line.product_id.id, list(
                product_payload['components'])))
            if len(_prodComp) > 0:
                bom_line_qty = _prodComp[0]['qty']
            elif not any(variant.name in mrp_order.product_id.display_name for variant in bom_line.bom_product_template_attribute_value_ids):
                bom_line_qty = 0
            components.append((0, 0, {
                'raw_material_production_id': mrp_order.id,
                'name': mrp_order.name,
                'product_id': bom_line.product_id.id,
                'product_uom': bom_line.product_uom_id.id,
                'product_uom_qty': bom_line_qty,
                'picking_type_id': mrp_order.picking_type_id.id,
                'location_id': mrp_order.location_src_id.id,
                'location_dest_id': bom_line.product_id.with_company(self.env.user.company_id.id).property_stock_production.id,
                'company_id': mrp_order.company_id.id,
            }))
        mrp_production = {
            'product_id': product_payload['id'],
            'product_uom_qty': product_payload['qty'],
            'product_uom': product_payload['uom_id'],
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
        return mrp_order.id


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
