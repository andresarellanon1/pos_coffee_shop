from odoo import models, fields, api


class CustomerWaybillWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    contact = fields.Many2one('res.partner', string='Contact', required=True, help='Select a contact from the Contacts module.')
    endpoint = fields.Many2one('q_endpoint_catalog.q_endpoint', string='Endpoint',
                               domain="[('contact_id', '=', contact), ('tags', 'ilike', 'waybill')]",
                               required=True, help='Select an endpoint to find the Waybill.')
    remote_waybills = fields.Json(string='Remote Waybills', compute='_compute_remote_waybills', readonly=True)

    @api.depends('contact', 'endpoint')
    def _compute_remote_waybills(self):
        if self.contact and self.endpoint:
            custom_headers = []
            custom_attributes = []
            response = self.env['q_endpoint_catalog.q_endpoint'].send_request(self.endpoint.id, custom_headers=custom_headers, custom_attributes=custom_attributes)
            if not isinstance(response, list):
                raise ValueError("The JSON response is not a list.")
            self.remote_waybills = response if response else []
