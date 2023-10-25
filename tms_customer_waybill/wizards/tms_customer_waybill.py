from odoo import models, fields, api
import logging
import json
logger = logging.getLogger(__name__)


class CustomerWaybillWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    contact = fields.Many2one('res.partner', string='Contact', required=True, help='Select a contact from the Contacts module.')
    endpoint = fields.Many2one('q_endpoint_catalog.q_endpoint', string='Endpoint',
                               domain="[('contact_id', '=', contact), ('tags', 'ilike', 'get_remote_waybill')]",
                               required=True, help='Select an endpoint to find the Waybill.')
    remote_waybills = fields.Json(string='Remote Waybills', compute='_compute_remote_waybills', readonly=True)

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
    def load_remote_waybills_as_pending_ryder(self, args):
        try:
            custom_headers = []
            custom_attributes = [
                {'key': "OperacionID", 'value': args['NoOperacion']},
                {'key': "ViajeID", 'value': args['NoViaje']}
            ]
            endpoints = self.env['q_endpoint_catalog.q_endpoint'].get_endpoint_ids_by_contact_name(args['ContactName'])
            endpoint = next((ep for ep in endpoints if ep['name'] == 'GetDatosCartaPorte'), None)
            json_response = self.env['q_endpoint_catalog.q_endpoint'].send_request(endpoint['id'], custom_headers=custom_headers, custom_attributes=custom_attributes)
            response = json.loads(json_response)
            # init vars
            origin_res_partner = False
            destine_res_partners = []
            # search or create origin partner
            existing_origin_partner = self.env['res.partner'].search([('vat', '=', response['OrigenRFC'])], limit=1)
            if existing_origin_partner:
                origin_res_partner = existing_origin_partner
            else:
                origin_res_partner = self.env['res.partner'].create({
                    'vat': response['OrigenRFC'],
                    'name': response['OrigenNombre'],
                    "company_type": "company",
                    "is_company": True,
                    "customer": True,
                    "supplier": False,
                    'street': response['OrigenCalle'],
                    'city': (lambda el: el.id if el else False)(self.env['res.city'].search([('code', '=', response['OrigenMunicipio'])], limit=1)),
                    'state_id': (lambda el: el.id if el else False)(self.env['res.country.state'].search([('code', '=', response['OrigenEstado'])], limit=1)),
                    'country_id': (lambda el: el.id if el else False)(self.env['res.country'].search([('code', '=', response['OrigenPais'])], limit=1)),
                    'postal_code': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.postal.code'].search([('name', '=', response['OrigenCP'])], limit=1)),
                    'colony': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.colony'].search([('code', '=', response['OrigenColonia'])], limit=1)),
                    'locality': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.res.locality'].search([('code', '=', response['OrigenLocalidad'])], limit=1)),
                })
            # search or create destination partners
            for destine in response['Destinatarios']:
                existing_destine_partner = self.env['res.partner'].search([('vat', '=', destine['OrigenRFC'])], limit=1)
                if existing_destine_partner:
                    destine_res_partners.append(existing_destine_partner)
                else:
                    destine_res_partners.append(self.env['res.partner'].create({
                        'vat': response['DestinoRFC'],
                        'name': response['DestinoNombre'],
                        "company_type": "company",
                        "is_company": True,
                        "customer": True,
                        "supplier": False,
                        'street': response['DestinoCalle'],
                        'city': (lambda el: el.id if el else False)(self.env['res.city'].search([('code', '=', destine['DestinoMunicipio'])], limit=1)),
                        'state_id': (lambda el: el.id if el else False)(self.env['res.country.state'].search([('code', '=', destine['DestinoEstado'])], limit=1)),
                        'country_id': (lambda el: el.id if el else False)(self.env['res.country'].search([('code', '=', destine['DestinoPais'])], limit=1)),
                        'postal_code': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.postal.code'].search([('name', '=', destine['DestinoCP'])], limit=1)),
                        'colony': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.colony'].search([('code', '=', destine['DestinoColonia'])], limit=1)),
                        'locality': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.res.locality'].search([('code', '=', destine['DestinoLocalidad'])], limit=1)),
                    }))
            # select index 0 destination partner, at least one is required
            arrival_address_id = destine_res_partners[0]
            # select customer (ryder) contact by name
            partner_id = self.env['res.partner'].search([('name', '=', args['ContactName'])], limit=1)
            # create waybill
            waybill = self.env['tms.waybill'].create({
                'state': 'draft',
                'operating_unit_id': self.env.user.default_operating_unit_id,
                'partner_id': partner_id,
                'partner_order_id': origin_res_partner,
                'departure_address_id': origin_res_partner,
                'partner_invoice_id': origin_res_partner,
                'arrival_address_id': arrival_address_id,
                'destination_ids': destine_res_partners[1:],
                'user_id': self.env.user.id,
                'company_id': self.env.user.company_id.id,
                # 'date_order': date_order,
                # 'currency_id': currency_id,
                # 'date_start': load_date_sched,
                # 'date_end': travel_end_sched,
            })
            return {
                'name': 'Waybill list view',
                'view_id': self.env.ref('tms.view_tms_waybill_form').id,
                'view_mode': 'form',
                'target': 'current',
                'res_model': 'tms.waybill',
                'res_id': waybill.id,
                'type': 'ir.actions.act_window'
            }
        except Exception as e:
            raise e
