from odoo import models, fields


class CustomWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    contact_id = fields.Many2one('res.partner', 'Contact', help='Select a contact from the Contacts module.', required=True)
    endpoint_id = fields.Many2one('q_endpoint_catalog.q_endpoint', 'Endpoint',
                                  domain="[('contact_id', '=', contact_id), ('tags', 'ilike', 'waybill')]",
                                  help='Select an endpoint to find the Waybill.', required=True)
