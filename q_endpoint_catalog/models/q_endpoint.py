
from odoo import models, fields, api


class QEndpoint(models.Model):
    _name = 'q_endpoint_catalog.q_endpoint'
    _description = 'REST Endpoint Catalog'

    name = fields.Char('Endpoint Name', required=True)
    url = fields.Char('URL', required=True)
    method = fields.Selection([
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE')
    ], 'HTTP Method', required=True)
    body = fields.Text('Request Body')
    response = fields.Text('Response')
    headers = fields.Text('Headers')
    is_authorization_required = fields.Boolean('Authorization Required')
    authorization = fields.Text('Authorization header', required=lambda self: self.is_authorization_required)

    @api.onchange('is_authorization_required')
    def _onchange_is_authorization_required(self):
        """
        Automatically set the authorization field as required or not based on is_authorization_required field.
        """
        if not self.is_authorization_required:
            self.authorization = False  # Clear the authorization value
