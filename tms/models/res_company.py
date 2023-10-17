# -*- coding: utf-8 -*-
from odoo import fields, models

class ResCompany(models.Model):
    _inherit = 'res.company'

    expense_currency_rate = fields.Float()
