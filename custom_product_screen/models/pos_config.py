from itertools import groupby
from odoo import models, fields
from odoo.tools.translate import _, _lt


class pos_config(models.Model):
    _inherit = 'pos.config'
    module_pos_mor = fields.Boolean("Is manufacturing order receiver")
    module_pos_mos = fields.Boolean("Is manufacturing order sender")
    
    def _action_to_open_ui(self):
        bandera = False
        user = self.env['pos.session'].search([('id', '=', self.current_session_id.id)])

        actual_user = self.env.user
        print('Usuario actual:')
        print(actual_user.name)

        print('Usuario actual ID:')
        print(actual_user.id)

        print('Usuario actual, es empleado?:')
        print(actual_user.employee)

        

        print('Session id name:')
        print(user.name)

        print('id de usuario:')
        print(user.user_id.id)

        print('id de usuario 2 :')
        print(self.current_user_id)
        
        user_res = self.env['res.users'].search([('id', '=', user.user_id.id)])
        print('usuario:')
        print(user_res.name)
        type =  user_res.partner_id.employee
        if type is True:
            bandera = True
        print('tipo:')
        print(type)

        if not self.current_session_id:
            self.env['pos.session'].create({'user_id': self.env.uid, 'config_id': self.id})
        path = '/pos/web' if self._force_http() else '/pos/ui'
        return {
            'type': 'ir.actions.act_url',
            'url': path + '?config_id=%d' % self.id,
            'target': 'self',
        }

    def type_user(self):
        bandera = False
        user = self.env['pos.session'].search([('id', '=', self.current_session_id.id)])
        print('id de usuario:')
        print(user.user_id.id)
        
        user_res = self.env['res.users'].search([('id', '=', user.user_id.id)])
        print('usuario:')
        print(user_res.name)
        type =  user_res.partner_id.employee
        if type is True:
            bandera = True
        print('tipo:')
        print(type)
        
        return bandera
        
    def open_ui(self):
        # valors = self.type_user()
        # print(valors)
     
        """Open the pos interface with config_id as an extra argument.

        In vanilla PoS each user can only have one active session, therefore it was not needed to pass the config_id
        on opening a session. It is also possible to login to sessions created by other users.

        :returns: dict
        """
        self.ensure_one()
        if not self.current_session_id:
            self._check_before_creating_new_session()
        self._validate_fields(self._fields)

        # check if there's any product for this PoS
        domain = [('available_in_pos', '=', True)]
        if self.limit_categories and self.iface_available_categ_ids:
            domain.append(('pos_categ_id', 'in', self.iface_available_categ_ids.ids))
            
        if not self.env['product.product'].search(domain):
            return {
                'name': _("There is no product linked to your PoS"),
                'type': 'ir.actions.act_window',
                'view_type': 'form',
                'view_mode': 'form',
                'res_model': 'pos.session.check_product_wizard',
                'target': 'new',
                'context': {'config_id': self.id}
            }

        return self._action_to_open_ui()

    
    # def open_ui(self):
    #     raise ValidationError("prb")
    #     res = super(pos_config, self).open_ui()
    #     return res
        
        
        
        
