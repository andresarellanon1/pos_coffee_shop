# -*- coding: utf-8 -*-
from odoo import fields, models

class TmsTollImport(models.Model):
    _name = 'tms.toll.import'
    _description = "Toll Import"

    uploaded_file = fields.Binary(string='Upload your file!')
