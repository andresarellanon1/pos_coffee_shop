from odoo import models, fields, api
from odoo.exceptions import ValidationError


class MrpProduction(models.Model):
    _inherit = 'stock.scrap'

    def mark_as_scrap(self, product_payload):
        vals = {
            'product_id': product_payload['id'],
            'scrap_qty': product_payload['qty'],
            'origin': product_payload['origin'],
            'company_id': self.env.user.company_id.id
        }
        scrap = self.sudo().create(vals)
        scrap.action_validate()
