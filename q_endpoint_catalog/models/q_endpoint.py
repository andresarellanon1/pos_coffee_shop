from odoo import models, fields, api
import json
import requests
import logging
logger = logging.getLogger(__name__)


class QEndpoint(models.Model):
    _name = 'q_endpoint_catalog.q_endpoint'
    _description = 'REST Endpoint Catalog'

    name = fields.Char('Endpoint Name', required=True, help='Enter a descriptive name for the REST endpoint.')
    contact_id = fields.Many2one('res.partner', 'Contact', help='Select a contact from the Contacts module.', required=True)
    url = fields.Char('URL', required=True, help='Enter the URL of the REST endpoint.')
    method = fields.Selection([
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE')
    ], 'HTTP Method', required=True, help='Select the HTTP method for the REST request.')
    body = fields.Many2many('q_endpoint_catalog.request_body', 'endpoint_id', 'Request Body', help='Optional. Define the actual attributes and values of the request body.')
    response = fields.Many2many('q_endpoint_catalog.response_attributes', 'endpoint_id', 'Response Attributes', help='Optional. Define the expected attributes of the response.')
    headers = fields.Many2many('q_endpoint_catalog.headers', 'endpoint_id', 'Headers', help='Optional. Manage a list of headers to include in the request.')

    @api.model
    def send_request(self, record_id, custom_headers=None, custom_attributes=None):
        """
        Send an HTTP request to the REST endpoint associated with the provided record ID and perform response type validation.

        :param record_id: The ID of the 'q_endpoint' record to process.
        :type record_id: int
        :param custom_headers: An array of custom headers as key-value pairs.
        :type custom_headers: list of dict
        :param custom_attributes: An array of custom body attributes as key-value pairs.
        :type custom_attributes: list of dict

        :return: A status message indicating success or an error message.
        :rtype: str
        """
        record = self.browse(record_id)
        headers = {}
        for header in record.headers:
            headers[header.name] = header.value
        if custom_headers:
            for header in custom_headers:
                headers[header['key']] = header['value']
        try:
            methods = {
                'GET': requests.get,
                'POST': requests.post,
                'PUT': requests.put,
                'DELETE': requests.delete,
            }
            request_data = {}
            for body_attr in record.body:
                request_data[body_attr.name] = body_attr.value
            if custom_attributes:
                for attribute in custom_attributes:
                    request_data[attribute['key']] = attribute['value']
            response = methods[record.method](record.url, headers=headers, data=json.dumps(request_data))
            response_data = response.json()
            for attr in record.response:
                if attr.name in response_data:
                    attr_type = attr.type
                    data_type = {
                        'string': str,
                        'integer': int,
                        'float': float,
                        'boolean': bool,
                        'list': list,
                        'object': dict,
                    }.get(attr_type, None)
                    if data_type is not None and not isinstance(response_data[attr.name], data_type):
                        return f"Attribute '{attr.name}' is not of type '{attr_type}'."
            return response_data
        except requests.exceptions.RequestException as e:
            logger.error(e)
            return f"Request Error: {str(e)}"
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(e)
            return f"Type Safety Error: {str(e)}"
        # Example usage from another module:
        # q_endpoint_response = self.env['q_endpoint_catalog.q_endpoint'].send_request(record_id, headers=[{'Authorization': 'Bearer Token'}], body_attributes=[{'name': 'new_attr', 'value': 'new_value'}])

    @api.model
    def get_endpoint_ids_by_contact_name(self, contact_name):
        """
        Retrieve a list of endpoint IDs related to a contact by contact name.

        :param str contact_name: The name of the contact for whom to retrieve related endpoints.

        :return: A list of endpoint IDs associated with the specified contact, or an empty list if no matches are found.
        :rtype: list
        """
        contact = self.env['res.partner'].search([('name', '=', contact_name)])
        if contact:
            endpoints = self.search_read([('contact_id', '=', contact.id)])
            return endpoints
        return []


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


class QEndpointHeaders(models.Model):
    _name = 'q_endpoint_catalog.headers'
    _description = 'Headers'

    name = fields.Text('Header', help='Enter the name of the header.')
    value = fields.Text('Value', help='Enter the value of the header.')


class QEndpointRequestBody(models.Model):
    _name = 'q_endpoint_catalog.request_body'
    _description = 'Request Body Attributes'

    name = fields.Char('Attribute Name', required=True)
    value = fields.Text('Value', help='Enter the value of the body attribute.')
