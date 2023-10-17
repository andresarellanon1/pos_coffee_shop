# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsRouteNote(models.Model):
    _name = 'tms.route.note'
    _description = "TMS Route Note"

    route_id = fields.Many2one('tms.route', string='Route', required=True)
    partner_id = fields.Many2one(
        'res.partner', string='Partner', required=True)
    notes = fields.Html(required=True)
    rules = fields.Html(required=True)
