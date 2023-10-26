from odoo import models, api
import logging
logger = logging.getLogger(__name__)


class tms_api_waybill(models.Model):
    _inherit = 'tms_customer_waybill.tms_api_waybill'

    @api.model
    def ryder_get_headers(self):
        return [
            {'displayName': 'No. Viaje', 'key': 'NoViaje'},
            {'displayName': 'No. Operacion', 'key': 'NoOperacion'},
            {'displayName': 'Status', 'key': 'status'},
        ]

    @api.model
    def ryder_get_meta(self):
        return {
            'pairs': [
                {'key': 'id', 'value': 'NoViaje'},
                {'key': 'NoViaje', 'value': 'NoViaje'},
                {'key': 'NoOperacion', 'value': 'NoOperacion'},
                {'key': 'status', 'value': 'status'},
            ],
            'actions': [
                {
                    'name': 'Cargar',
                    'pairs': [
                        {'key': 'NoViaje', 'value': 'NoViaje'},
                        {'key': 'NoOperacion', 'value': 'NoOperacion'},
                    ]
                },
            ]
        }

    @api.model
    def ryder_get_items(self, raw_remote_waybills, partner_id):
        # NOTE: could manually construct the identifier here "{NoOperacion}-{partner_prefix}-{NoViaje}"
        # but rather use the function in case the formating of the identifier ever changes
        items = raw_remote_waybills['Data']
        status_retrieved = map(lambda item: {
            **item,
            'status': self.get_status_by_transaction_identifier(
                self.get_transaction_identifier(partner_id, item['NoOperacion'], item['NoViaje'])
            )
        }, items)
        return list(status_retrieved)

    @api.model
    def ryder_load_remote_waybills_as_pending(self, args):
        try:
            custom_headers = []
            custom_attributes = [
                {'key': "OperacionID", 'value': args['NoOperacion']},
                {'key': "ViajeID", 'value': args['NoViaje']}
            ]
            endpoints = self.env['q_endpoint_catalog.q_endpoint'].get_endpoint_ids_by_contact_id(args['ContactId'])
            endpoint = next((ep for ep in endpoints if ep['name'] == 'GetDatosCartaPorte'), None)
            response = self.env['q_endpoint_catalog.q_endpoint'].send_request(endpoint['id'], custom_headers=custom_headers, custom_attributes=custom_attributes)
            # init vars
            origin_res_partner = False
            destine_res_partners = []
            # search or create origin partner
            existing_origin_partner = self.env['res.partner'].search([('vat', '=', response['Datos']['OrigenRFC'])], limit=1)
            if existing_origin_partner:
                origin_res_partner = existing_origin_partner
            else:
                origin_res_partner = self.env['res.partner'].create({
                    'vat': response['Datos']['OrigenRFC'],
                    'name': response['Datos']['OrigenNombre'],
                    "company_type": "company",
                    "is_company": True,
                    'street': response['Datos']['OrigenCalle'],
                    'city': (lambda el: el.id if el else False)(self.env['res.city'].search([('l10n_mx_edi_code', '=', response['Datos']['OrigenMunicipio'])], limit=1)),
                    'state_id': (lambda el: el.id if el else False)(self.env['res.country.state'].search([('code', '=', response['Datos']['OrigenEstado'])], limit=1)),
                    'country_id': (lambda el: el.id if el else False)(self.env['res.country'].search([('code', '=', response['Datos']['OrigenPais'])], limit=1)),
                    'postal_code': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.postal.code'].search([('name', '=', response['Datos']['OrigenCP'])], limit=1)),
                    'colony': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.colony'].search([('colony_code', '=', response['Datos']['OrigenColonia'])], limit=1)),
                    'l10n_mx_edi_locality_id': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.res.locality'].search([('code', '=', response['Datos']['OrigenLocalidad'])], limit=1)),
                })
            # search or create destination partners
            for destine in response['Datos']['Destinatarios']:
                existing_destine_partner = self.env['res.partner'].search([('vat', '=', destine['DestinoRFC'])], limit=1)
                if existing_destine_partner:
                    destine_res_partners.append(existing_destine_partner)
                else:
                    destine_res_partners.append(self.env['res.partner'].create({
                        'vat': destine['DestinoRFC'],
                        'name': destine['DestinoNombre'],
                        "company_type": "company",
                        "is_company": True,
                        'street': f"{destine['DomicilioCalle']}-{destine['DestinoNumeroExterior']}",
                        'city': (lambda el: el.id if el else False)(self.env['res.city'].search([('l10n_mx_edi_code', '=', destine['DomicilioMunicipio'])], limit=1)),
                        'state_id': (lambda el: el.id if el else False)(self.env['res.country.state'].search([('code', '=', destine['DomicilioEstado'])], limit=1)),
                        'country_id': (lambda el: el.id if el else False)(self.env['res.country'].search([('code', '=', destine['DomicilioPais'])], limit=1)),
                        'postal_code': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.postal.code'].search([('name', '=', destine['DomicilioCP'])], limit=1)),
                        'colony': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.colony'].search([('colony_code', '=', destine['DestinoColonia'])], limit=1)),
                        'l10n_mx_edi_locality_id': (lambda el: el.id if el else False)(self.env['l10n_mx_edi.res.locality'].search([('code', '=', destine['DomicilioLocalidad'])], limit=1)),
                    }))
            # select index 0 destination partner, at least one is required
            arrival_address_id = destine_res_partners[0].id
            # select customer (ryder) contact by id
            partner_id = self.env['res.partner'].search([('id', '=', args['ContactId'])], limit=1)
            # create waybill
            waybill = self.env['tms.waybill'].create({
                'state': 'draft',
                'operating_unit_id': self.env.user.default_operating_unit_id,
                'partner_id': partner_id,
                'partner_order_id': origin_res_partner.id,
                'departure_address_id': origin_res_partner.id,
                'partner_invoice_id': origin_res_partner.id,
                'arrival_address_id': arrival_address_id,
                'destination_ids': [(6, 0, destine_res_partners[1:].mapped('id'))],
                'user_id': self.env.user.id,
                'company_id': self.env.user.company_id.id,
                # 'date_order': date_order,
                # 'currency_id': currency_id,
                # 'date_start': load_date_sched,
                # 'date_end': travel_end_sched,
            })
            # Don't forget to create transaction history
            self.env['custom.transaction'].create({
                'transaction_identifier': self.get_transaction_identifier(partner_id.id, args['NoOperacion'], args['NoViaje']),
                'contact_id': partner_id.id,
                'status': waybill.state,
                'waybill_id': waybill,
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
            logger.error(e)
            raise e
