from itertools import groupby
from odoo import models, api


class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.model
    def _pos_ui_models_to_load(self):
        models_to_load = [
            'res.company',
            'decimal.precision',
            'uom.uom',
            'res.country.state',
            'res.country',
            'res.lang',
            'account.tax',
            'pos.session',
            'pos.config',
            'pos.bill',
            'res.partner',
            'stock.picking.type',
            'res.users',
            'product.pricelist',
            'res.currency',
            'pos.category',
            'product.product',
            'product.template',
            'product.packaging',
            'account.cash.rounding',
            'pos.payment.method',
            'account.fiscal.position',
            'mrp.bom',
            'mrp.bom.line',
            'hr.employee'
        ]

        return models_to_load

    def _get_attributes_by_ptal_id(self):
        product_attributes = self.env['product.attribute'].search(
            [('create_variant', '!=', 'no_variant')])
        product_attributes_by_id = {
            product_attribute.id: product_attribute for product_attribute in product_attributes}
        domain = [('attribute_id', 'in', product_attributes.mapped('id'))]
        product_template_attribute_values = self.env['product.template.attribute.value'].search(
            domain)

        def key(ptav):
            return (ptav.attribute_line_id.id, ptav.attribute_id.id)
        res = {}
        for key, group in groupby(
                sorted(product_template_attribute_values, key=key), key=key):
            attribute_line_id, attribute_id = key
            values = [
                {
                    'id': ptav.id,
                    'name': ptav.name,
                    'display_name': ptav.display_name,
                    'display_type': ptav.display_type,
                    'product_attribute_value_id': ptav.product_attribute_value_id.id,
                    'html_color': ptav.html_color,
                    'is_custom': ptav.is_custom,
                    'price_extra': ptav.price_extra
                } for ptav in group]
            res[attribute_line_id] = {
                'id': attribute_line_id,
                'name': product_attributes_by_id[attribute_id].name,
                'display_type': product_attributes_by_id[attribute_id].display_type,
                'values': values
            }

        return res

    def _get_pos_ui_product_template(self, params):
        self = self.with_context(**params['context'])
        products = self.env['product.template'].search_read(
            **params['search_params'])
        return products

    def _loader_params_product_template(self):
        domain = [
            '&', '&', ('sale_ok', '=', True), ('available_in_pos',
                                               '=', True), '|',
            ('company_id', '=', self.config_id.company_id.id), ('company_id', '=', False)
        ]
        if self.config_id.limit_categories and self.config_id.iface_available_categ_ids:
            domain = AND(
                [domain, [('pos_categ_id', 'in', self.config_id.iface_available_categ_ids.ids)]])
        if self.config_id.iface_tipproduct:
            domain = OR(
                [domain, [('id', '=', self.config_id.tip_product_id.id)]])

        return {
            'search_params': {
                'domain': domain,
                'fields': [
                    'display_name', 'list_price', 'categ_id', 'pos_categ_id', 'taxes_id', 'barcode',
                    'default_code', 'to_weight', 'uom_id', 'description_sale', 'description', 'tracking',
                    'write_date', 'available_in_pos', 'attribute_line_ids', 'active', 'bom_ids'
                ],
                'order': 'sequence,default_code,name',
            },
            'context': {'display_default_code': False},
        }

    def _get_pos_ui_mrp_bom(self, params):
        self = self.with_context(**params['context'])
        boms = self.env['mrp.bom'].search_read(**params['search_params'])
        return boms

    def _loader_params_mrp_bom(self):
        domain = []
        return {
            'search_params': {
                'domain': domain,
                'fields': [
                    'display_name', 'bom_line_ids', 'consumption', 'id',
                    'operation_ids', 'picking_type_id', 'picking_type_id',
                    'picking_type_id', 'product_qty', 'code',
                    'product_tmpl_id', 'product_uom_id', 'product_tmpl_id'

                ],
                'order': 'sequence,code,display_name',
            },
            'context': {'code': False},
        }

    def _get_pos_ui_mrp_bom_line(self, params):
        self = self.with_context(**params['context'])
        bom_lines = self.env['mrp.bom.line'].search_read(
            **params['search_params'])
        return bom_lines

    def _loader_params_mrp_bom_line(self):
        domain = []
        return {
            'search_params': {
                'domain': domain,
                'fields': [
                    'display_name', 'bom_id', 'bom_product_template_attribute_value_ids',
                    'id', 'product_id', 'product_qty',
                    'product_tmpl_id', 'sequence', 'tracking'
                ],
                'order': 'sequence,display_name',
            },
            'context': {'code': False},
        }
