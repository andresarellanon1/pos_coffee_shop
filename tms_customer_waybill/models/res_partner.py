from odoo import models, fields, api


class ResPartner(models.Model):
    _inherit = 'res.partner'

    prefix = fields.Char(string="Prefix", index=True)

    @api.model
    def get_prefix_by_partner_id(self, partner_id):
        partner = self.browse(partner_id)
        return partner.prefix
