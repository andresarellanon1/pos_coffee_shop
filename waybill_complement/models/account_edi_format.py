# -*- coding: utf-8 -*-
from odoo import models, _

class AccountEdiFormat(models.Model):
    _inherit = 'account.edi.format'

    def _l10n_mx_edi_get_invoice_cfdi_values(self, invoice):
        # OVERRIDE FOR WAYBILL COMPLEMENT
        vals = super()._l10n_mx_edi_get_invoice_cfdi_values(invoice)

        if invoice.waybill_ids:
            vals['datos_cp'] = invoice._generar_datos_cartaporte()

        return vals
