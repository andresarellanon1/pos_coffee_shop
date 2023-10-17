# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsTollData(models.Model):
    _name = 'tms.toll.data'
    _order = 'date asc'
    _description = "Toll Data"

    date = fields.Datetime()
    name = fields.Char()
    num_tag = fields.Char(string='Tag number')
    economic_number = fields.Char()
    import_rate = fields.Float()
    toll_station = fields.Char()
    expense_line_id = fields.Many2one(
        'tms.expense.line', string='Expense line')
    state = fields.Selection([
        ('open', 'Open'),
        ('closed', 'Closed')],
        default='open')
