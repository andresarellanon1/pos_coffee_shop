# -*- coding: utf-8 -*-
from odoo import _, api, fields, models

class AccountMove(models.Model):
    _inherit = 'account.move'

    waybill_ids = fields.One2many(
        'tms.waybill', 'invoice_id', string="Waybills", readonly=True)

    @api.onchange('journal_id')
    def _onchange_journal_id(self):
        if not self.waybill_ids:
            return super(AccountMove, self)._onchange_journal_id()

        self.currency_id = self.waybill_ids[0].currency_id.id
        return True

    def unlink(self):
        for rec in self:
            advances = self.env['tms.advance'].search(
                [('payment_move_id', '=', rec.id)])
            expenses = self.env['tms.expense'].search(
                [('payment_move_id', '=', rec.id)])
            loans = self.env['tms.expense.loan'].search(
                [('payment_move_id', '=', rec.id)])

            if advances:
                for advance in advances:
                    advance.paid = False

            if expenses:
                for expense in expenses:
                    expense.paid = False

            if loans:
                for loan in loans:
                    loan.paid = False

            return super(AccountMove, self).unlink()
