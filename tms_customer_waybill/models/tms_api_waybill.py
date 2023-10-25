from odoo import models, fields, api


class TmsApiWaybill(models.Model):
    _name = 'tms_customer_waybill.tms_api_waybill'
    _description = 'Tms Customer Api Models'
    transaction_identifier = fields.Char(string='Transaction Identifier', required=True)
    contact_id = fields.Many2one('res.partner', string='Contact')
    status = fields.Selection(related='waybill_id.state', string='Status', store=True)
    waybill_id = fields.Many2one('tms.waybill', string='Waybill')

    @api.onchange('waybill_id')
    def _onchange_waybill_id(self):
        self.status = self.waybill_id.state

    @api.model
    def get_transaction_identifier(self, partner_id, prefix, subfix):
        partner_prefix = self.env['res.partner'].get_prefix_by_partner_id(partner_id)
        return f"{prefix}-{partner_prefix}-{subfix}"

    @api.model
    def get_status_by_transaction_identifier(self, transaction_identifier):
        transaction = self.search([('transaction_identifier', '=', transaction_identifier)], limit=1)
        if not transaction:
            raise 'not_found'
        return transaction.status
