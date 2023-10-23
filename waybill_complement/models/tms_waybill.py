# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class TmsWaybill(models.Model):
    _inherit = 'tms.waybill'

    is_transfer = fields.Boolean(string='Is Transfer?')
    destination_ids = fields.Many2many('res.partner', string='Destinations')
    enabled_multi_destinations = fields.Boolean(compute="_compute_enabled_multi_destinations")

    @api.onchange('is_transfer')
    def _onchange_is_transfer(self):
        for line in self.transportable_line_ids:
            line.is_transfer = self.is_transfer

    @api.onchange('destination_ids', 'arrival_address_id')
    def _onchange_destinations(self):
        destination_ids = [rec._origin.id for rec in self.destination_ids]
        is_multi_dest_enabled = True if len(self.destination_ids) > 0 else False

        for line in self.transportable_line_ids:
            line.original_destination_id = self.arrival_address_id
            line.enabled_line_multi_destinations = is_multi_dest_enabled
            line.destination_ids = self.destination_ids

            if not line.destination_id.id in destination_ids:
                line.destination_id = self.arrival_address_id

    @api.depends('destination_ids')
    def _compute_enabled_multi_destinations(self):
        self.enabled_multi_destinations = True if len(self.destination_ids) > 0 else False
