# -*- coding: utf-8 -*-
from odoo import models, fields, _

class FleetVehicle(models.Model):
    _inherit = 'fleet.vehicle'

    sct_permit_number = fields.Char(string='SCT Permit Number')
    sct_permit = fields.Char(string='SCT Permit')
    vehicle_configuration = fields.Many2one('fleet.vehicle.configuration', string='Vehicle Configuration')
    trailer_subtype = fields.Many2one('fleet.vehicle.trailer.subtype', string='Trailer Subtype')
    rented = fields.Boolean(string='Is Rented?')
    tenant = fields.Many2one('res.partner', string='Tenant')
