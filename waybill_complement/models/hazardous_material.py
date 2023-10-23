# -*- coding: utf-8 -*-
from odoo import models, fields, _

class HazardousMaterial(models.Model):
    _name = 'l10n_mx_edi.hazardous.material'
    _description = 'Hazardous Material'

    name = fields.Char(string='Description', required=True)
    code = fields.Char(string='Hazardous Material Code', required=True)
    packaging = fields.Char(string='Packaging')
    active = fields.Boolean(string='Active', default=True)
