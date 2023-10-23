# -*- coding: utf-8 -*-
from odoo import models, fields, _

class PostalCode(models.Model):
    _name = 'l10n_mx_edi.postal.code'
    _description = 'Postal Code'

    name = fields.Char(string='Postal Code', required=True)
    state_code = fields.Char(string='State Code', required=True)
