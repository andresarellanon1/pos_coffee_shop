from odoo import models, fields, api
import json


class CustomerWaybillWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    contact = fields.Many2one('res.partner', string='Contact', required=True, help='Select a contact from the Contacts module.')
    endpoint = fields.Many2one('q_endpoint_catalog.q_endpoint', string='Endpoint',
                               domain="[('contact_id', '=', contact), ('tags', 'ilike', 'waybill')]",
                               required=True, help='Select an endpoint to find the Waybill.')
    remote_waybills = fields.One2many('tms_customer_waybill.remote_waybill', 'customer_waybill_wizard_id', string='Remote Waybills', readonly=True)

    @api.onchange('contact', 'endpoint')
    def _onchange_contact_endpoint(self):
        self.remote_waybills = [(5, 0, 0)]
        if self.contact and self.endpoint:
            endpoint = self.endpoint
            custom_headers = []
            custom_attributes = []
            response = endpoint.send_request(custom_headers=custom_headers, custom_attributes=custom_attributes)
            if not isinstance(response, list):
                raise ValueError("The JSON response is not a list.")
            new_remote_waybills = []
            for item in response:
                if not isinstance(item, dict):
                    raise ValueError("Each element in the JSON response should be a dictionary.")
                new_remote_waybill = self.env['tms_customer_waybill.remote_waybill'].create({
                    'customer_waybill_wizard_id': self.id,
                    'custom_data': item,
                })
                new_remote_waybills.append((4, new_remote_waybill.id))
            self.remote_waybills = new_remote_waybills


class RemoteWaybill(models.Model):
    _name = 'tms_customer_waybill.remote_waybill'
    _description = 'Remote Waybill'

    customer_waybill_wizard_id = fields.Many2one('tms_customer_waybill.customer_waybill_wizard', string='Customer Waybill Wizard')
    custom_data = fields.Json(string='Custom Data', help='JSON field for custom data')
