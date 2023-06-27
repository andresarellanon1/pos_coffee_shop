from itertools import groupby
from odoo import models, fields
from odoo.tools.translate import _, _lt

import logging
_logger = logging.getLogger(__name__)

class pos_config(models.Model):
    _inherit = 'pos.config'
    module_pos_mor = fields.Boolean("Is manufacturing order receiver")
    module_pos_mos = fields.Boolean("Is manufacturing order sender")
    
    def open_ui(self):
        res = super(pos_config, self).open_ui()
        
        
    _logger.warning('HOLAAAA')
