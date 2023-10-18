from odoo import models, fields, api


class CustomerWaybillWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    contact = fields.Many2one('res.partner', string='Contact', required=True, help='Select a contact from the Contacts module.')
    endpoint = fields.Many2one('q_endpoint_catalog.q_endpoint', string='Endpoint',
                               domain="[('contact_id', '=', contact), ('tags', 'ilike', 'waybill')]",
                               required=True, help='Select an endpoint to find the Waybill.')
#
#     remote_waybills = fields.One2many('tms_customer_waybill.remote_waybill', 'customer_waybill_wizard_id ', string='Remote Waybills', compute='_compute_remote_waybills', readonly=True)
#
#     @api.onchange('contact', 'endpoint')
#     def _onchange_contact_endpoint(self):
#         # Clear the existing remote waybills
#         self.remote_waybills = [(5, 0, 0)]
#         if self.contact and self.endpoint:
#             endpoint = self.endpoint
#             custom_headers = []
#             custom_attributes = []
#             # Call the send_request method
#             response = endpoint.send_request(custom_headers=custom_headers, custom_attributes=custom_attributes)
#             # Update the remote_waybills field with the response
#             # TODO: update the keys from the response to get the correct values from the json provided by the customer
#             # TODO: do this whole stuff on a generic way to prvent diferent customer having diferent json response keys
#             self.remote_waybills = [(0, 0, {'customer_id': response.get('"NoViaje":'), 'client_id': response.get('"NoViajeCliente":')})]
#
#     @api.model
#     def _perform_custom_action(self):
#         # This method listens for the custom action
#         # Perform the desired action when the action is triggered
#         # You can add your custom logic here
#         return True
#
#
# class RemoteWaybill(models.Model):
#     _name = 'tms_customer_waybill.remote_waybill'
#     _description = 'Remote Waybill'
#
#     customer_waybill_wizard_id = fields.Many2one('tms_customer_waybill.customer_waybill_wizard', string='Customer Waybill Wizard')
#     customer_id = fields.Char(string='Customer', help='Customer id associated with the remote waybill')
#     client_id = fields.Char(string='Client', help='Odoo id associated with the waybill')
