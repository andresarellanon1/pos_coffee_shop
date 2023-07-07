from itertools import groupby
from odoo import models, fields
from odoo.tools.translate import _, _lt


class pos_config(models.Model):
    _inherit = 'pos.config'

    def type_user(self):
        bandera = False
        actual_user = self.env.user
        if actual_user.employee:
            bandera = True
        return bandera
