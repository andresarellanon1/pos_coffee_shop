# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class TmsWaybillTransportableLine(models.Model):
    _inherit = 'tms.waybill.transportable.line'

    is_transfer = fields.Boolean(string='Is Transfer?')
    sat_merchandise_code_id = fields.Many2one('l10n_mx_edi.sat.merchandise.code', string='SAT Merchandise Code')
    hazardous_material_value = fields.Char(related='sat_merchandise_code_id.hazardous_material')
    merchandise_weight = fields.Float(string='Weight in KG', digits=(1, 1), required=True, default=0)
    is_hazardous_material = fields.Boolean(string='Is Hazardous Material?')
    hazardous_material_id = fields.Many2one('l10n_mx_edi.hazardous.material', string='Hazardous Material Code')
    packaging_code_id = fields.Many2one('l10n_mx_edi.packaging', string='Packaging')
    destination_id = fields.Many2one('res.partner', string='Destination')

    destination_ids = fields.Many2many('res.partner', store=False, string='Destinations')
    original_destination_id = fields.Many2one('res.partner', store=False)
    enabled_line_multi_destinations = fields.Boolean(store=False)

    @api.depends('transportable_id')
    def _compute_transportable(self):
        for rec in self:
            rec.dummy_field = False

            if not rec.destination_id and rec.original_destination_id:
                rec.destination_id = rec.original_destination_id

    dummy_field = fields.Boolean(compute=_compute_transportable)

    @api.onchange('sat_merchandise_code_id')
    def _onchange_sat_merchandise_code_id(self):
        if self.sat_merchandise_code_id.hazardous_material == '1':
            self.is_hazardous_material = True
        else:
            self.is_hazardous_material = False
