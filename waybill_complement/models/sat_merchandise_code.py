# -*- coding: utf-8 -*-
from odoo import models, fields, _

class SATMerchandiseCode(models.Model):
    _name = 'l10n_mx_edi.sat.merchandise.code'
    _description = 'SAT Merchandise Code'

    name = fields.Char(string='Description', required=True)
    code = fields.Char(string='SAT Merchandise Code', required=True)
    hazardous_material = fields.Char(string='Hazardous Material', required=True)
    active = fields.Boolean(string='Active', default=True)
