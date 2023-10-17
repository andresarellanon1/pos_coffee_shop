# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsRetention(models.Model):
    _name = 'tms.retention'
    _description = 'Retentions for travel expenses'
    _inherit = 'mail.thread'

    name = fields.Char(required=True)
    type = fields.Selection(
        [('days', 'Days'), ('salary', 'Salary')],
        required=True,
        help='Set this field to define how the retention is computed:\n'
             'Days: factor * days of travel\n'
             'Salary: factor * driver salary')
    factor = fields.Float(
        help='Factor to compute the retention depending of the type:\n'
             'Days: factor * days of travel\n'
             'Salary: factor * driver salary',
        digits=(20, 4),)
    mixed = fields.Boolean(
        help='Check this if you want to compute the retention plus a fixed amount')
    fixed_amount = fields.Float()
    employee_ids = fields.Many2many(
        'hr.employee', string='Employees', domain="[('driver', '=', True)]")
    product_id = fields.Many2one('product.product', string='Product', required=True,
        domain="['|', ('apply_for_retention', '=', True), ('tms_product_category', '=', 'ispt_retention')]")
    notes = fields.Text(string="Notes")
    active_retention = fields.Boolean(string='Active Retention', default=True)
    ispt_retention = fields.Boolean('Retention for ISPT')
