# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsRouteTollstationCostperaxis(models.Model):
    _name = 'tms.route.tollstation.costperaxis'
    _description = "TMS Route Tollstation Costperaxis"

    axis = fields.Integer(required=True)
    cost_credit = fields.Float(required=True)
    cost_cash = fields.Float(required=True)
    tollstation_id = fields.Many2one('tms.route.tollstation', string='Toll Station')
