# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsRoutePlace(models.Model):
    _name = 'tms.route.place'
    _description = "TMS Route Place"
    _order = 'sequence'

    route_id = fields.Many2one('tms.route', required=True, string="Route")
    sequence = fields.Integer(default=10)
    place_id = fields.Many2one('tms.place', string="Place")
    state_id = fields.Many2one('res.country.state', related="place_id.state_id",
        readonly=True, string="State")
    country_id = fields.Many2one('res.country', related="place_id.country_id",
        readonly=True, string="Country")
