# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

class ResPartner(models.Model):
    _inherit = 'res.partner'

    postal_code = fields.Many2one('l10n_mx_edi.postal.code', string='Postal Code')
    colony = fields.Many2one('l10n_mx_edi.colony', string='Colony')
    id_location_com = fields.Char(compute='_get_id_location_com', string='')
    state_code = fields.Char(related='state_id.code')
    tax_id = fields.Char(string='Tax Identity Registration Number')

    def _get_id_location_com(self):
        for record in self:
            id_computed = int(record.id)
            id_name_computed = format(id_computed, '06')
            record.id_location_com = id_name_computed

    @api.onchange('postal_code')
    def _onchange_postal_code(self):
        self.zip = self.postal_code.name

    @api.onchange('colony')
    def _onchange_colony(self):
        self.l10n_mx_edi_colony = self.colony.name
