# -*- coding: utf-8 -*-
from odoo import models, fields, _

class Colony(models.Model):
    _name = 'l10n_mx_edi.colony'
    _description = 'Colonies'

    name = fields.Char(string='Colony Name', required=True)
    colony_code = fields.Char(string='Colony Code', required=True)
    colony_postal_code = fields.Char(string='Colony Postal Code', required=True)
