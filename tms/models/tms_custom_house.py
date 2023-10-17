# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsCustom(models.Model):
    _name = 'tms.custom.house'
    _description = "Custom House"

    custom_ids = fields.One2many('tms.customs', 'custom_house_id', string="Custom House")
    name = fields.Char(required=True)
