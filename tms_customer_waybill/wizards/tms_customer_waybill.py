from odoo import models, fields, api


class CustomWizard(models.TransientModel):
    _name = 'tms_customer_waybill.customer_waybill_wizard'
    _description = 'Customer Waybill Wizard'

    customer = fields.Selection([
        ('customer_1', 'Ryder'),
        ('customer_2', 'Customer 2'),
        ('customer_3', 'Customer 3'),
    ], string='Select Customer')

    custom_widget = fields.Char(compute='_compute_custom_widget', string='Custom Widget')

    @api.depends('customer')
    def _compute_custom_widget(self):
        for wizard in self:
            if wizard.customer == 'customer_1':
                wizard.custom_widget = 'customer_tms_waybill.RayderCustomerWaybillWidget'
            elif wizard.customer == 'customer_2':
                wizard.custom_widget = 'customer_tms_waybill.custom_widget_2'
            elif wizard.customer == 'customer_3':
                wizard.custom_widget = 'customer_tms_waybill.custom_widget_3'
