# -*- coding: utf-8 -*-

from odoo import fields, models

class TmsCustoms(models.Model):
    _name = 'tms.customs'
    _description = "Customs"

    waybill_id = fields.Many2one('tms.waybill')
    customs = fields.Char()
    custom_house_id = fields.Many2one(
        'tms.custom.house', string="Custom House")
    datetime = fields.Datetime(default=fields.Datetime.now)
    return_datetime = fields.Datetime(string="Date of Return")
    returned_datetime = fields.Datetime(string="Date of Returned")
