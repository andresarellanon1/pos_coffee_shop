from odoo import fields, models

class TmsRouteFuelEfficiency(models.Model):
    _name = 'tms.route.fuelefficiency'
    _description = "Route Fuel Efficiency"

    route_id = fields.Many2one('tms.route', string="Route")
    engine_id = fields.Many2one('fleet.vehicle.engine', string="Engine", required=True)
    type = fields.Selection([
        ('unit', 'Unit'),
        ('single', 'Single'),
        ('double', 'Double')
    ], required=True)
    performance = fields.Float(required=True)
