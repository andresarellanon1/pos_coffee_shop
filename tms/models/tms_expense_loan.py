# -*- coding: utf-8 -*-
from odoo import _, api, exceptions, fields, models
from odoo.exceptions import ValidationError
from datetime import datetime

class TmsExpenseLoan(models.Model):
    _name = "tms.expense.loan"
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = "Tms Expense Loan"

    operating_unit_id = fields.Many2one(
        'operating.unit', string='Operating Unit', required=True)
    name = fields.Char()
    date = fields.Date(
        required=True,
        default=fields.Date.context_today)
    date_confirmed = fields.Date('Confirmed Date',
        readonly=True,
        related='move_id.date')
    employee_id = fields.Many2one(
        'hr.employee', 'Driver', required=True)
    expense_ids = fields.Many2many(comodel_name='tms.expense.line', readonly=True)
    state = fields.Selection(
        [('draft', 'Draft'),
         ('authorized', 'Waiting for authorization'),
         ('approved', 'Approved'),
         ('confirmed', 'Confirmed'),
         ('closed', 'Closed'),
         ('cancel', 'Cancelled'), ],
        readonly=True,
        default='draft')
    discount_method = fields.Selection([
        ('each', 'Each Travel Expense Record'),
        ('weekly', 'Weekly'),
        ('fortnightly', 'Fortnightly'),
        ('monthly', 'Monthly')], required=True)
    discount_type = fields.Selection([
        ('fixed', 'Fixed'),
        ('percent', 'Loan Percentage'), ], required=True)
    notes = fields.Text()
    origin = fields.Char()
    amount = fields.Float(required=True)
    percent_discount = fields.Float()
    fixed_discount = fields.Float()
    paid = fields.Boolean(
        compute='_compute_paid',
        store=True, readonly=True)
    balance = fields.Float(compute='_compute_balance', store=True)
    active_loan = fields.Boolean()
    lock = fields.Boolean(string='Other Discount?')
    amount_discount = fields.Float()
    product_id = fields.Many2one(
        'product.product', 'Discount Product',
        required=True,
        domain=[('tms_product_category', '=', 'loan')])
    expense_id = fields.Many2one(
        'tms.expense', 'Expense Record', readonly=True)
    payment_move_id = fields.Many2one(
        'account.move',
        string="Payment Entry",
        readonly=True,
        ondelete='restrict',)
    currency_id = fields.Many2one(
        'res.currency',
        'Currency',
        required=True,
        default=lambda self: self.env.user.company_id.currency_id)
    move_id = fields.Many2one(
        'account.move', 'Journal Entry',
        help="Link to the automatically generated Journal Items.\nThis move "
        "is only for Loan Expense Records with balance < 0.0",
        readonly=True,
        ondelete='restrict',)
    company_id = fields.Many2one(
        'res.company', string='Company', required=True,
        default=lambda self: self.env.user.company_id)

    @api.model_create_multi
    def create(self, values):
        loan = super(TmsExpenseLoan, self).create(values)
        if not loan.operating_unit_id.loan_sequence_id:
            raise ValidationError(_(
                'You need to define the sequence for loans in base %s' %
                loan.operating_unit_id.name
            ))
        sequence = loan.operating_unit_id.loan_sequence_id
        loan.name = sequence.next_by_id()
        return loan

    def action_authorized(self):
        for rec in self:
            rec.state = 'approved'

    def action_approve(self):
        for rec in self:
            if rec.discount_type == 'fixed' and rec.fixed_discount <= 0.0:
                raise exceptions.ValidationError(
                    _('Could not approve the Loan.'
                      ' The Amount of discount must be greater than zero.'))
            elif (rec.discount_type == 'percent' and
                  rec.percent_discount <= 0.0):
                raise exceptions.ValidationError(
                    _('Could not approve the Loan.'
                      ' The Amount of discount must be greater than zero.'))

            rec.state = 'approved'
            rec.message_post(body=_('<strong>Loan approved.</strong>'))

    def action_cancel(self):
        for rec in self:
            if rec.paid:
                payment_move_id = rec.payment_move_id
                rec.payment_move_id = False
                payment_move_id.button_cancel()
                payment_move_id.line_ids.remove_move_reconcile()
                payment_move_id.unlink()

            rec.expense_id = False
            rec.expense_ids = False
            rec.balance = rec.amount
            rec.state = 'cancel'
            rec.message_post(body=_('<strong>Loan cancelled.</strong>'))

    def action_confirm(self):
        for loan in self:
            obj_account_move = self.env['account.move']
            loan_journal_id = (
                loan.operating_unit_id.loan_journal_id.id)
            loan_debit_account_id = (
                loan.employee_id.
                tms_loan_account_id.id
            )
            loan_credit_account_id = (
                loan.employee_id.
                address_home_id.property_account_payable_id.id
            )

            if not loan_journal_id:
                raise exceptions.ValidationError(
                    _('Warning! The loan does not have a journal'
                      ' assigned. Check if you already set the '
                      'journal for loans in the base.'))

            if not loan_credit_account_id:
                raise exceptions.ValidationError(
                    _('Warning! The driver does not have a home address'
                      ' assigned. Check if you already set the '
                      'home address for the employee.'))

            if not loan_debit_account_id:
                raise exceptions.ValidationError(
                    _('Warning! You must have configured the accounts '
                      'of the tms'))

            move_lines = []
            total = loan.currency_id.compute(
                loan.amount,
                self.env.user.currency_id)

            if total > 0.0:
                accounts = {
                    'credit': loan_credit_account_id,
                    'debit': loan_debit_account_id
                }

                for name, account in accounts.items():
                    move_line = (0, 0, {
                        'name': loan.name,
                        'partner_id': (
                            loan.employee_id.address_home_id.id),
                        'account_id': account,
                        'debit': (total if name == 'debit' else 0.0),
                        'credit': (total if name == 'credit' else 0.0),
                        'journal_id': loan_journal_id,
                        'operating_unit_id': loan.operating_unit_id.id,
                    })

                    move_lines.append(move_line)

                self.write({
                    'state': 'confirmed',
                    'date_confirmed': datetime.now()
                })

                self.message_post(body=_('<strong>Loan confirmed.</strong>'))

    def action_cancel_draft(self):
        for rec in self:
            rec.state = 'draft'
            rec.message_post(body=_('<strong>Loan drafted.</strong>'))

    @api.depends('expense_ids', 'amount')
    def _compute_balance(self):
        for loan in self:
            line_amount = 0.0

            if not loan.expense_ids:
                loan.balance = loan.amount
            else:
                for line in loan.expense_ids:
                    line_amount += line.price_total

                loan.balance = loan.amount + line_amount

    def unlink(self):
        for rec in self:
            if rec.state == 'confirmed' or rec.state == 'closed':
                raise ValidationError(
                    _('You can not delete a Loan'
                      ' in status confirmed or closed'))
            return super(TmsExpenseLoan, self).unlink()

    @api.depends('payment_move_id')
    def _compute_paid(self):
        for rec in self:
            rec.paid = False

            if rec.payment_move_id.id:
                rec.paid = True

    def action_pay(self):
        for rec in self:
            bank = self.env['account.journal'].search([('type', '=', 'bank')])[0]
            wiz = self.env['tms.payment.wizard'].with_context(
                active_model='tms.expense.loan', active_ids=[rec.id]).create({
                    'journal_id': bank.id,
                    'amount_total': rec.amount,
                    'date': rec.date,
                })
            wiz.make_payment()

    def open_payment_wizard(self):
        return {
            'name': _('Make Payment'),
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            "view_type": "form",
            'res_model': 'tms.payment.wizard',
            'target': 'new',
            'view_id': self.env.ref('tms.tms_payment_wizard_view_form').id
    }
