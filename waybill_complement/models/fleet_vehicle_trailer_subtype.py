# -*- coding: utf-8 -*-
from odoo import models, fields, _

class FleetVehicleTrailerSubtype(models.Model):
    _name = 'fleet.vehicle.trailer.subtype'
    _description = 'Trailer Subtype'

    code = fields.Char(string='Trailer Subtype Code', required=True)
    name = fields.Char(string='Description', required=True)
