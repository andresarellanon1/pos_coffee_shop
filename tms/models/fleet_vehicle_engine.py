from odoo import fields, models

class FleetVehicleEngine(models.Model):
    _name = 'fleet.vehicle.engine'
    _description = "Fleet Vehicle Engine"

    name = fields.Char(required=True)
