# -*- coding: utf-8 -*-
from odoo import fields, models

class OperatingUnit(models.Model):
    _inherit = 'operating.unit'

    travel_sequence_id = fields.Many2one(
        'ir.sequence', string='Travel Sequence', required=True)
    prepaid_fuel_sequence_id = fields.Many2one(
        'ir.sequence', string='Prepaid Sequence', required=True)
    fuel_log_sequence_id = fields.Many2one(
        'ir.sequence', string='Fuel Log Sequence')
    advance_sequence_id = fields.Many2one(
        'ir.sequence', string='Advance Sequence', required=True)
    waybill_sequence_id = fields.Many2one(
        'ir.sequence', string='Waybill Sequence', required=True)
    expense_sequence_id = fields.Many2one(
        'ir.sequence', string='Expense Sequence', required=True)
    loan_sequence_id = fields.Many2one(
        'ir.sequence', string='Expense Loan Sequence', required=True)
    advance_journal_id = fields.Many2one(
        'account.journal', string='Advance Journal', required=True)
    expense_journal_id = fields.Many2one(
        'account.journal', string='Expense Journal', required=True)
    loan_journal_id = fields.Many2one(
        'account.journal', string='Expense Loan Journal', required=True)
    sale_journal_id = fields.Many2one(
        'account.journal', string='Sale Journal', required=True)
    purchase_journal_id = fields.Many2one(
        'account.journal', string='Purchase Journal', required=True)
    ieps_product_id = fields.Many2one(
        'product.product', string='IEPS Product', required=True)
    credit_limit = fields.Float()
