# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsWaybillTaxes(models.Model):
    _name = "tms.waybill.taxes"
    _description = "Waybill Taxes"
    _order = "tax_amount desc"

    waybill_id = fields.Many2one('tms.waybill', 'Waybill', readonly=True, ondelete='cascade')
    tax_id = fields.Many2one('account.tax', 'Tax', readonly=True, store=True)
    account_id = fields.Many2one(
        'account.account', 'Tax Account', required=False,
        domain=[('type', '<>', 'view'),
                ('type', '<>', 'income'),
                ('type', '<>', 'closed')])
    account_analytic_id = fields.Many2one(
        'account.analytic.account', 'Analytic account')
    base = fields.Float(digits=(12,4), readonly=True)
    tax_amount = fields.Float(digits=(12,4), readonly=True)
