# -*- coding: utf-8 -*-
from odoo import _, api, exceptions, fields, models

class ProductTemplate(models.Model):
    _inherit = "product.template"

    tms_product_category = fields.Selection([
        ('freight', 'Freight (Waybill)'),
        ('move', 'Moves (Waybill)'),
        ('insurance', 'Insurance'),
        ('tolls', 'Highway Tolls'),
        ('other', 'Other'),
        ('real_expense', 'Real Expense'),
        ('made_up_expense', 'Made up Expense'),
        ('salary', 'Salary'),
        ('salary_retention', 'Salary Retention'),
        ('salary_discount', 'Salary Discount'),
        ('fuel', 'Fuel'),
        ('other_income', 'Other Income'),
        ('refund', 'Refund'),
        ('negative_balance', 'Negative Balance'),
        ('fuel_cash', 'Fuel in Cash'),
        ('tollstations', 'Tollstations (Expenses)'),
        ('loan', 'Loan'),
        ('ispt_retention', 'ISPT Salary Retention')],
        string='Fregith Product Category')
    apply_for_salary = fields.Boolean(string='Apply for Salary')
    apply_for_retention = fields.Boolean(string='Apply for Retention')
    apply_for_ispt = fields.Boolean(string='Apply for ISPT')
    use_expense_account = fields.Boolean(string='Use Expense Account?')

    #Migrador
    usar_cuenta_de_gasto = fields.Boolean(string='usar_cuenta_de_gasto')
    l10n_mx_edi_code_sat_id = fields.Many2one('product.unspsc.code', 'UNSPSC Category', domain=[('applies_to', '=', 'product')], help='The UNSPSC code related to this product.  Used for edi in Colombia, Peru and Mexico')

    @api.constrains('tms_product_category')
    def unique_product_per_category(self):
        for rec in self:
            categorys = [
                ['move', 'Moves'],
                ['salary', 'Salary'],
                ['negative_balance', 'Negative Balance'],
                ['indirect_expense', 'Indirect Expense']
            ]

            for category in categorys:
                product = rec.search([('tms_product_category', '=', category[0])])

                if len(product) > 1:
                    raise exceptions.ValidationError(
                        _('Only there must be a product with category "' +
                            category[1] + '"'))
