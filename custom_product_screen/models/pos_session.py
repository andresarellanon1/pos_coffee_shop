from itertools import groupby
from odoo import models, _
from odoo import api, fields, models, _, Command

class PosSession(models.Model):
    _inherit = 'pos.session'

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
        ]

        return models_to_load

    def _get_attributes_by_ptal_id(self):
        product_attributes = self.env['product.attribute'].search([('create_variant', '!=', 'no_variant')])
        product_attributes_by_id = {product_attribute.id: product_attribute for product_attribute in product_attributes}
        domain = [('attribute_id', 'in', product_attributes.mapped('id'))]
        product_template_attribute_values = self.env['product.template.attribute.value'].search(domain)
        key = lambda ptav: (ptav.attribute_line_id.id, ptav.attribute_id.id)
        res = {}
        for key, group in groupby(sorted(product_template_attribute_values, key=key), key=key):
            attribute_line_id, attribute_id = key
            values = [{**ptav.product_attribute_value_id.read(['name', 'is_custom', 'html_color'])[0],
                       'price_extra': ptav.price_extra} for ptav in list(group)]
            res[attribute_line_id] = {
                'id': attribute_line_id,
                'name': product_attributes_by_id[attribute_id].name,
                'display_type': product_attributes_by_id[attribute_id].display_type,
                'values': values
            }

        return res

    def _get_pos_ui_product_template(self, params):
        self = self.with_context(**params['context'])
        if not self.config_id.limited_products_loading:
            products = self.env['product.template'].search_read(**params['search_params'])
        else:
            products = self.config_id.get_limited_products_loading(params['search_params']['fields'])

        self._process_pos_ui_product_product(products)
        return products


    def _loader_params_product_template(self):
        domain = [
            '&', '&', ('sale_ok', '=', True), ('available_in_pos', '=', True), '|',
            ('company_id', '=', self.config_id.company_id.id), ('company_id', '=', False)
        ]
        if self.config_id.limit_categories and self.config_id.iface_available_categ_ids:
            domain = AND([domain, [('pos_categ_id', 'in', self.config_id.iface_available_categ_ids.ids)]])
        if self.config_id.iface_tipproduct:
            domain = OR([domain, [('id', '=', self.config_id.tip_product_id.id)]])

        return {
            'search_params': {
                'domain': domain,
                'fields': [
                    'display_name', 'lst_price', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id', 'barcode',
                    'default_code', 'to_weight', 'uom_id', 'description_sale', 'description', 'product_tmpl_id', 'tracking',
                    'write_date', 'available_in_pos', 'attribute_line_ids', 'active'
                ],
                'order': 'sequence,default_code,name',
            },
            'context': {'display_default_code': False},
        }







