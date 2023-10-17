# -*- coding: utf-8 -*-
from odoo import api, fields, models
from odoo.tools.translate import _
from odoo.exceptions import UserError

class ResCompany(models.Model):
    _inherit = "res.company"

    inter_ou_clearing_account_id = fields.Many2one("account.account",
        "Inter-operating unit clearing account")
    ou_is_self_balanced = fields.Boolean("Operating Units are self-balanced",
        help="Activate if your company is "
        "required to generate a balanced"
        " balance sheet for each "
        "operating unit.")

    @api.constrains("ou_is_self_balanced", "inter_ou_clearing_account_id")
    def _inter_ou_clearing_acc_required(self):
        for rec in self:
            if rec.ou_is_self_balanced and not \
                    rec.inter_ou_clearing_account_id:

                raise UserError(_("Configuration error!\nPlease indicate an\
                Inter-operating unit clearing account."))
