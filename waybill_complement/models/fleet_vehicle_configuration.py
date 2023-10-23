# -*- coding: utf-8 -*-
from odoo import models, fields, _

class FleetVehicleConfiguration(models.Model):
    _name = 'fleet.vehicle.configuration'
    _description = 'Vehicle Configuration'

    code = fields.Char(string='Configuration Code', required=True)
    name = fields.Char(string='Description', required=True)
    axes = fields.Char(string='Axes Number')
    tires = fields.Char(string='Tires Number')
