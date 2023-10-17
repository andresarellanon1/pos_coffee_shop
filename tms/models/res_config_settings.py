# -*- coding: utf-8 -*-
from odoo import fields, models

class ResConfigSettings(models.TransientModel):
    _inherit = ['res.config.settings']

    expense_currency_rate = fields.Float(related='company_id.expense_currency_rate', readonly=False)

