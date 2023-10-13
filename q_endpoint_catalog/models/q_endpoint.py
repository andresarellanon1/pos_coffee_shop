
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
    body = fields.Text('Request Body', help='Enter a valid JSON for the request body.')
    response = fields.Text('Response', help='Enter a valid JSON for the request response.')
    headers = fields.One2many('q_endpoint_catalog.headers', 'endpoint_id', 'Headers')
    is_authorization_required = fields.Boolean('Authorization Required')
    authorization = fields.Text('Authorization header')

    @api.onchange('is_authorization_required')
    def _onchange_is_authorization_required(self):
        """
        Automatically set the authorization field as required or not based on is_authorization_required field.
        """
        if not self.is_authorization_required:
            self.authorization = False  # Clear the authorization value


class QEndpointHeaders(models.Model):
    _name = 'q_endpoint_catalog.headers'
    _description = 'Headers'

    name = fields.Text('Header')
    value = fields.Text('Value')
    endpoint_id = fields.Many2one('q_endpoint_catalog.q_endpoint', 'Endpoint')
