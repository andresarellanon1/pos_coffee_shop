from odoo import api, models

class AccountPartialReconcile(models.Model):
    _inherit = "account.partial.reconcile"

    @api.model
    def _prepare_cash_basis_base_line_vals(self, base_line, balance, amount_currency):
        res = super()._prepare_cash_basis_base_line_vals(
            base_line, balance, amount_currency
        )
        res.update({"operating_unit_id": base_line.operating_unit_id.id})
        return res

    @api.model
    def _prepare_cash_basis_tax_line_vals(self, tax_line, balance, amount_currency):
        res = super()._prepare_cash_basis_tax_line_vals(
            tax_line, balance, amount_currency
        )
        res.update({"operating_unit_id": tax_line.operating_unit_id.id})
        return res

    @api.model
    def _prepare_cash_basis_counterpart_tax_line_vals(self, tax_line, cb_tax_line_vals):
        res = super()._prepare_cash_basis_counterpart_tax_line_vals(
            tax_line, cb_tax_line_vals
        )
        res.update({"operating_unit_id": tax_line.operating_unit_id.id})
        return res
