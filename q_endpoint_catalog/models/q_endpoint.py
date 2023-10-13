from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json
import requests


class QEndpoint(models.Model):
    _name = 'q_endpoint_catalog.q_endpoint'
    _description = 'REST Endpoint Catalog'

    name = fields.Char('Endpoint Name', required=True, help='Enter a descriptive name for the REST endpoint.')
    url = fields.Char('URL', required=True, help='Enter the URL of the REST endpoint.')
    method = fields.Selection([
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE')
    ], 'HTTP Method', required=True, help='Select the HTTP method for the REST request.')
    body = fields.One2many('q_endpoint_catalog.request_body', 'endpoint_id', 'Request Body')
    response = fields.One2many('q_endpoint_catalog.response_attributes', 'endpoint_id', 'Response Attributes', help='Define the expected attributes of the response.')
    headers = fields.One2many('q_endpoint_catalog.headers', 'endpoint_id', 'Headers', help='Manage a list of headers to include in the request.')

    @api.constrains('body')
    def _check_request_body(self):
        for record in self:
            request_body = json.loads(record.body)
            body_attributes = record.body.filtered(lambda attr: attr.endpoint_id == record)

            for attr in body_attributes:
                if attr.name not in request_body:
                    raise ValidationError(f"Attribute '{attr.name}' is missing in the request body.")

                expected_type = attr.type
                actual_type = type(request_body[attr.name]).__name__

                if expected_type == 'string' and actual_type != 'str':
                    raise ValidationError(f"Attribute '{attr.name}' should be of type 'string' but is of type '{actual_type}'.")

                if expected_type == 'integer' and actual_type != 'int':
                    raise ValidationError(f"Attribute '{attr.name}' should be of type 'integer' but is of type '{actual_type}'.")

                if expected_type == 'float' and actual_type != 'float':
                    raise ValidationError(f"Attribute '{attr.name}' should be of type 'float' but is of type '{actual_type}'.")

                if expected_type == 'boolean' and actual_type != 'bool':
                    raise ValidationError(f"Attribute '{attr.name}' should be of type 'boolean' but is of type '{actual_type}'.")

                if expected_type == 'list' and actual_type != 'list':
                    raise ValidationError(f"Attribute '{attr.name}' should be of type 'list' but is of type '{actual_type}'.")

                if expected_type == 'object' and actual_type != 'dict':
                    raise ValidationError(f"Attribute '{attr.name}' should be of type 'object' but is of type '{actual_type}'.")

    def _validate_response_attribute(self, response_data, attr):
        attr_name = attr.name
        attr_type = attr.type

        if attr_name not in response_data:
            raise ValueError(f"Expected attribute '{attr_name}' not found in the response.")

        data_type = {
            'string': str,
            'integer': int,
            'float': float,
            'boolean': bool,
            'list': list,
            'object': dict,
        }.get(attr_type, None)

        if data_type is None or not isinstance(response_data[attr_name], data_type):
            raise ValueError(f"Attribute '{attr_name}' is not of type '{attr_type}'.")

    @api.model
    def send_request(self, record_id):
        """
        Send an HTTP request to the REST endpoint associated with the provided record ID and perform response type validation.

        :param record_id: The ID of the 'q_endpoint' record to process.
        :type record_id: int

        :return: A status message indicating success or an error message.
        :rtype: str
        """
        record = self.browse(record_id)

        headers = {}
        for header in record.headers:
            headers[header.name] = header.value

        try:
            methods = {
                'GET': requests.get,
                'POST': requests.post,
                'PUT': requests.put,
                'DELETE': requests.delete,
            }
            response = methods[record.method](record.url, **headers, data=json.loads(record.body))

            response_data = response.json()

            for attr in record.response:
                self._validate_response_attribute(response_data, attr)

        except requests.exceptions.RequestException as e:
            return f"Request Error: {str(e)}"
        except (json.JSONDecodeError, ValueError) as e:
            return f"Type Safety Error: {str(e)}"

        return "Success"
    # Usage example from another module
    # q_endpoint_response = self.env['q_endpoint_catalog.q_endpoint'].send_request(record_id)


class QEndpointResponseAttributes(models.Model):
    _name = 'q_endpoint_catalog.response_attributes'
    _description = 'Response Attributes'

    name = fields.Char('Attribute Name', required=True, help='Enter the name of the expected attribute in the response.')
    type = fields.Selection([
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('list', 'List'),
        ('object', 'Object')
    ], 'Attribute Type', required=True, help='Select the data type of the expected attribute.')
    endpoint_id = fields.Many2one('q_endpoint_catalog.q_endpoint', 'Endpoint')


class QEndpointHeaders(models.Model):
    _name = 'q_endpoint_catalog.headers'
    _description = 'Headers'

    name = fields.Text('Header', help='Enter the name of the header.')
    value = fields.Text('Value', help='Enter the value of the header.')
    endpoint_id = fields.Many2one('q_endpoint_catalog.q_endpoint', 'Endpoint')


class QEndpointRequestBody(models.Model):
    _name = 'q_endpoint_catalog.request_body'
    _description = 'Request Body Attributes'

    name = fields.Char('Attribute Name', required=True)
    type = fields.Selection([
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('list', 'List'),
        ('object', 'Object'),
    ], 'Attribute Type', required=True)
    endpoint_id = fields.Many2one('q_endpoint_catalog.q_endpoint', 'Endpoint', ondelete='cascade')
