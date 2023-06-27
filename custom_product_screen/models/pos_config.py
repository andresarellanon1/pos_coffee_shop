from itertools import groupby
from odoo import models, fields
from odoo.tools.translate import _, _lt


class pos_config(models.Model):
    _inherit = 'pos.config'
    module_pos_mor = fields.Boolean("Is manufacturing order receiver")
    module_pos_mos = fields.Boolean("Is manufacturing order sender")
    
    def open_ui(self):
        res = super(pos_config, self).open_ui()
        
        raise ValueError('H0LAAAAAA')
        
        
