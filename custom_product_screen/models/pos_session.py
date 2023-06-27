from itertools import groupby
from odoo import models, fields


class PosSession(models.Model):
    _inherit = 'pos.session'
    # sender_session_id = fields.Many2one(
    #     'pos.session', string='Sender session id',
    #     required=False,
    #     index=False,
    #     readonly=False,
    #     default='',
    #     ondelete='restrict')
    #
    # receiver_session_id = fields.Many2one(
    #     'pos.session', string='Receiver session id',
    #     required=False,
    #     index=False,
    #     readonly=False,
    #     states={'opening_control': [('readonly', False)]},
    #     default='',
    #     ondelete='restrict')
    #
    
    
    @api.model_create_multi
    def create(self, vals_list):
        
        res = super(PosSession, self).create()
        valor = pos_config
        
        raise ValidationError("config_id: %s", valor)
    
        return res
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
        product_attributes = self.env['product.attribute'].search(
            [('create_variant', '!=', 'no_variant')])
        product_attributes_by_id = {
            product_attribute.id: product_attribute for product_attribute in product_attributes}
        domain = [('attribute_id', 'in', product_attributes.mapped('id'))]
        product_template_attribute_values = self.env['product.template.attribute.value'].search(
            domain)

        def key(ptav): return (ptav.attribute_line_id.id, ptav.attribute_id.id)
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
        print(params)
        products = self.env['product.template'].search_read(
            **params['search_params'])
        return products

    # def _process_pos_ui_product_template(self, products):
        # if self.config_id.currency_id != self.company_id.currency_id:
        #    for product in products:
        #        product['lst_price'] = self.company_id.currency_id._convert(product['lst_price'], self.config_id.currency_id, self.company_id, fields.Date.today())
        # categories = self._get_pos_ui_product_category(self._loader_params_product_category())
        # product_category_by_id = {category['id']: category for category in categories }
        # for product in products:
        #    product['categ'] = product_category_by_id[product['categ_id'][0]]
        #    product['image_128'] = bool(product['image_128'])

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
                    'display_name', 'standard_price', 'categ_id', 'pos_categ_id', 'taxes_id', 'barcode',
                    'default_code', 'to_weight', 'uom_id', 'description_sale', 'description', 'tracking',
                    'write_date', 'available_in_pos', 'attribute_line_ids', 'active'
                ],
                'order': 'sequence,default_code,name',
            },
            'context': {'display_default_code': False},
        }
