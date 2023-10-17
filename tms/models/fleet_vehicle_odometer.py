# -*- coding: utf-8 -*-
from odoo import fields, models

class FleetVehicleOdometer(models.Model):
    _inherit = 'fleet.vehicle.odometer'

    last_odometer = fields.Float(string='Last Read', required=True)
    current_odometer = fields.Float(string='Current Read', required=True)
    distance = fields.Float(required=True)
    travel_id = fields.Many2one('tms.travel', string='Travel')
