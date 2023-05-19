# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from itertools import groupby
from odoo import models, _

class PosSession(models.Model):
    _inherit = 'pos.session'

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

