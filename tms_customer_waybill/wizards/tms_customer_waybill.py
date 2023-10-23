from odoo import models, fields, api
import logging
logger = logging.getLogger(__name__)


class CustomerWaybillWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    contact = fields.Many2one('res.partner', string='Contact', required=True, help='Select a contact from the Contacts module.')
    endpoint = fields.Many2one('q_endpoint_catalog.q_endpoint', string='Endpoint',
                               domain="[('contact_id', '=', contact), ('tags', 'ilike', 'get_remote_waybill')]",
                               required=True, help='Select an endpoint to find the Waybill.')
    remote_waybills = fields.Json(string='Remote Waybills', compute='_compute_remote_waybills', readonly=True, widget='customer_waybill_widget')

    @api.depends('contact', 'endpoint')
    def _compute_remote_waybills(self):
        self.load_waybills()

    def load_waybills(self):
        self.remote_waybills = False
        if self.contact and self.endpoint:
            custom_headers = []
            custom_attributes = []
            json_response = self.env['q_endpoint_catalog.q_endpoint'].send_request(self.endpoint.id, custom_headers=custom_headers, custom_attributes=custom_attributes)
            self.remote_waybills = json_response

    @api.model
    def _load_remote_waybills_as_pending_ryder(self, args):
        no_operacion = args['NoOperacion']
        no_viaje = args['NoViaje']
        contact_name = args['ContactName']
        custom_headers = []
        custom_attributes = [{
            "OperacionID": no_operacion,
            "ViajeID": no_viaje
        }]
        endpoints = self.env['q_endpoint_catalog.q_endpoint'].get_endpoint_ids_by_contact_name(contact_name)
        endpoint = next((ep for ep in endpoints if ep.name == 'GetDatosCartaPorte'), None)
        json_response = self.env['q_endpoint_catalog.q_endpoint'].send_request(endpoint.id, custom_headers=custom_headers, custom_attributes=custom_attributes)
        # 
        # self.env['tms.waybill'].create({
        #     'operating_unit_id': operating_unit_id,
        #     'name': waybill_name,
        #     'partner_id': customer_partner_id,
        #     'departure_address_id': departure_address_id,
        #     'arrival_address_id': arrival_address_id,
        #     'state': 'draft',
        #     'date_order': date_order,
        #     'user_id': salesman_user_id,
        #     'currency_id': currency_id,
        #     'company_id': company_id,
        #     'partner_invoice_id': invoice_address_id,
        #     'partner_order_id': ordering_contact_id,
        #     'date_start': load_date_sched,
        #     'date_end': travel_end_sched,
        # })
        # leave at pending state
        pass
