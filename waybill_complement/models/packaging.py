# -*- coding: utf-8 -*-
from odoo import models, fields, _

class Packaging(models.Model):
    _name = 'l10n_mx_edi.packaging'
    _description = 'Packaging'

    name = fields.Char(string='Description', required=True)
    code = fields.Char(string='Packaging Code', required=True)
    active = fields.Boolean(string='Active', default=True)
