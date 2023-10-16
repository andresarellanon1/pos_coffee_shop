from odoo import models, api


class pos_config(models.Model):
    _inherit = 'pos.config'

    @api.model
    def type_user(self):
        bandera = False
        actual_user = self.env.user
        if actual_user.employee:
            bandera = True
        return bandera
