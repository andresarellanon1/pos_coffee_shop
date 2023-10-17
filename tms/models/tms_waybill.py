# -*- coding: utf-8 -*-
from __future__ import division
from odoo import _, api, exceptions, fields, models
import logging

_logger = logging.getLogger(__name__)

try:
    from num2words import num2words
except ImportError:
    _logger.debug('Cannot `import num2words`.')

class TmsWaybill(models.Model):
    _name = 'tms.waybill'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Waybills'
    _order = 'name desc'

    operating_unit_id = fields.Many2one(
        'operating.unit', string='Operating Unit', required=True)
    customer_factor_ids = fields.One2many(
        'tms.factor', 'waybill_id',
        string='Waybill Customer Charge Factors',
        domain=[('category', '=', 'customer'), ])
    supplier_factor_ids = fields.One2many(
        'tms.factor', 'waybill_id',
        string='Waybill Supplier Payment Factors',
        domain=[('category', '=', 'supplier'), ])
    driver_factor_ids = fields.One2many(
        'tms.factor', 'waybill_id',
        string='Travel Driver Payment Factors',
        domain=[('category', '=', 'driver'), ])
    transportable_line_ids = fields.One2many(
        'tms.waybill.transportable.line', 'waybill_id', string="Transportable")
    tax_line_ids = fields.One2many(
        'tms.waybill.taxes', 'waybill_id', string='Tax Lines', store=True)
    name = fields.Char()
    travel_ids = fields.Many2many('tms.travel', copy=False, string='Travels')
    state = fields.Selection([
        ('draft', 'Pending'),
        ('approved', 'Approved'),
        ('confirmed', 'Confirmed'),
        ('cancel', 'Cancelled')], readonly=True,
        help="Gives the state of the Waybill.",
        default='draft')
    date_order = fields.Datetime(
        'Date', required=True,
        default=fields.Datetime.now)
    user_id = fields.Many2one(
        'res.users', 'Salesman',
        default=(lambda self: self.env.user))
    partner_id = fields.Many2one(
        'res.partner',
        'Customer', required=True, change_default=True)
    currency_id = fields.Many2one(
        'res.currency', 'Currency', required=True,
        default=lambda self: self.env.user.company_id.currency_id)
    company_id = fields.Many2one(
        'res.company', string='Company', required=True,
        default=lambda self: self.env.user.company_id)
    partner_invoice_id = fields.Many2one(
        'res.partner', 'Invoice Address', required=True,
        help="Invoice address for current Waybill.",
        default=(lambda self: self.partner_id))
    partner_order_id = fields.Many2one(
        'res.partner', 'Ordering Contact', required=True,
        help="The name and address of the contact who requested the "
        "order or quotation.",
        default=(lambda self: self.partner_id))
    departure_address_id = fields.Many2one(
        'res.partner', 'Departure Address', required=True,
        help="Departure address for current Waybill.", change_default=True)
    arrival_address_id = fields.Many2one(
        'res.partner', 'Arrival Address', required=True,
        help="Arrival address for current Waybill.", change_default=True)
    upload_point = fields.Char(change_default=True)
    download_point = fields.Char(change_default=True)
    invoice_id = fields.Many2one(
        'account.move', 'Invoice', readonly=True, copy=False)
    invoice_paid = fields.Boolean(
        compute="_compute_invoice_paid", readonly=True)
    supplier_invoice_id = fields.Many2one(
        'account.move', string='Supplier Invoice', readonly=True)
    supplier_invoice_paid = fields.Boolean()
    waybill_line_ids = fields.One2many(
        'tms.waybill.line', 'waybill_id',
        string='Waybill Lines')
    transportable_ids = fields.One2many(
        'tms.waybill.transportable.line', 'waybill_id',
        string='Shipped Products')
    product_qty = fields.Float(
        compute='_compute_transportable_product',
        string='Sum Qty')
    product_volume = fields.Float(
        compute='_compute_transportable_product',
        string='Sum Volume')
    product_weight = fields.Float(
        compute='_compute_transportable_product',
        string='Sum Weight')
    amount_freight = fields.Float(
        compute='_compute_amount_freight',
        string='Freight')
    amount_move = fields.Float(
        compute='_compute_amount_move',
        string='Moves')
    amount_highway_tolls = fields.Float(
        compute='_compute_amount_highway_tolls',
        string='Highway Tolls')
    amount_insurance = fields.Float(
        compute='_compute_amount_insurance',
        string='Insurance')
    amount_other = fields.Float(
        compute='_compute_amount_other',
        string='Other')
    amount_untaxed = fields.Float(
        compute='_compute_amount_untaxed',
        string='Subtotal', store=True)
    amount_tax = fields.Float(
        compute='_compute_amount_tax',
        string='Taxes')
    amount_total = fields.Float(
        compute='_compute_amount_total',
        string='Total', store=True)
    distance_real = fields.Float(
        help="Route obtained by electronic reading")
    distance_route = fields.Float()
    notes = fields.Html()
    date_start = fields.Datetime(
        'Load Date Sched', help="Date Start time for Load",
        default=fields.Datetime.now)
    date_up_start_sched = fields.Datetime(
        'UpLd Start Sched',
        default=fields.Datetime.now)
    date_up_end_sched = fields.Datetime(
        'UpLd End Sched',
        default=fields.Datetime.now)
    date_up_docs_sched = fields.Datetime(
        'UpLd Docs Sched',
        default=fields.Datetime.now)
    date_appoint_down_sched = fields.Datetime(
        'Download Date Sched',
        default=fields.Datetime.now)
    date_down_start_sched = fields.Datetime(
        'Download Start Sched',
        default=fields.Datetime.now)
    date_down_end_sched = fields.Datetime(
        'Download End Sched',
        default=fields.Datetime.now)
    date_down_docs_sched = fields.Datetime(
        'Download Docs Sched',
        default=fields.Datetime.now)
    date_end = fields.Datetime(
        'Travel End Sched', help="Date End time for Load",
        default=fields.Datetime.now)
    date_start_real = fields.Datetime('Load Date Real')
    date_up_start_real = fields.Datetime('UpLoad Start Real')
    date_up_end_real = fields.Datetime('UpLoad End Real')
    date_up_docs_real = fields.Datetime('Load Docs Real')
    date_appoint_down_real = fields.Datetime('Download Date Real')
    date_down_start_real = fields.Datetime('Download Start Real')
    date_down_end_real = fields.Datetime('Download End Real')
    date_down_docs_real = fields.Datetime('Download Docs Real')
    date_end_real = fields.Datetime('Travel End Real')
    waybill_extradata_ids = fields.One2many(
        'tms.extradata', 'waybill_id',
        string='Extra Data Fields',
        copy=True,
        states={'confirmed': [('readonly', True)]})
    custom_ids = fields.One2many(
        'tms.customs',
        'waybill_id',
        string="Customs")

    expense_ids = fields.Many2many(
        'tms.expense', compute='_compute_expense_ids', string="Expenses")

    @api.depends('travel_ids')
    def _compute_expense_ids(self):
        for rec in self:
            rec.expense_ids = False

            for travel in rec.travel_ids:
                rec.expense_ids += travel.expense_id

    @api.model_create_multi
    def create(self, values):
        waybill = super(TmsWaybill, self).create(values)
        sequence = waybill.operating_unit_id.waybill_sequence_id
        waybill.name = sequence.next_by_id()
        product = self.env['product.product'].search([
            ('tms_product_category', '=', 'freight')], limit=1)

        if product:
            self.waybill_line_ids.create({
                'tax_ids': [(6, 0, [x.id for x in (product.taxes_id)])],
                'name': product.name,
                'waybill_id': waybill.id,
                'product_id': product.id,
                'unit_price': waybill._compute_transportable_product(),
                'account_id': product.property_account_income_id.id,
            })

        waybill.onchange_waybill_line_ids()
        return waybill

    def write(self, values):
        for rec in self:
            if 'partner_id' in values:
                for travel in rec.travel_ids:
                    travel.partner_ids = False
                    travel._compute_partner_ids()

            res = super(TmsWaybill, self).write(values)
            return res

    @api.onchange('partner_id')
    def onchange_partner_id(self):
        if self.partner_id:
            self.partner_order_id = self.partner_id
            self.partner_invoice_id = self.partner_id

    def action_approve(self):
        for waybill in self:
            waybill.state = 'approved'
            self.message_post(body=_("<h5><strong>Approved</strong></h5>"))

    @api.depends('invoice_id')
    def _compute_invoice_paid(self):
        for rec in self:
            paid = (rec.invoice_id and rec.invoice_id.state == 'paid')
            rec.invoice_paid = paid

    @api.onchange('customer_factor_ids', 'transportable_line_ids')
    def _onchange_waybill_line_ids(self):
        for rec in self:
            for product in rec.waybill_line_ids:
                if product.product_id.tms_product_category == 'freight':
                    product.write({
                        'unit_price': rec._compute_transportable_product()})

    @api.model
    def _compute_transportable_product(self):
        for waybill in self:
            total_get_amount = 0.0
            waybill.product_volume = 0.0
            waybill.product_qty = 0
            waybill.product_weight = 0.0

            for factor in waybill.customer_factor_ids:
                if factor.factor_type in ['distance', 'distance_real', 'percent',
                    'percent_drive', 'travel', 'amount_driver']:

                    for travel in waybill.travel_ids:
                        waybill.distance_route += travel.route_id.distance

                    waybill.distance_real = 0.0
                    total_get_amount += waybill.customer_factor_ids.get_amount(
                        waybill.product_weight, waybill.distance_route,
                        waybill.distance_real, waybill.product_qty,
                        waybill.product_volume, waybill.amount_total)
                else:
                    for record in waybill.transportable_line_ids:
                        waybill.product_qty = record.quantity

                        if (record.transportable_uom_id.category_id.name == _('Volume')):
                            waybill.product_volume += record.quantity
                        elif (record.transportable_uom_id.category_id.name == _('Weight')):
                            waybill.product_weight += record.quantity

                        total_get_amount += (
                            waybill.customer_factor_ids.get_amount(
                                waybill.product_weight, waybill.distance_route,
                                waybill.distance_real, waybill.product_qty,
                                waybill.product_volume, waybill.amount_total))

            return total_get_amount

    def _compute_amount_all(self, category):
        for waybill in self:
            field = 0.0

            for line in waybill.waybill_line_ids:
                if (line.product_id.tms_product_category == category):
                    field += line.price_subtotal

            return field

    @api.depends('waybill_line_ids')
    def _compute_amount_freight(self):
        for rec in self:
            rec.amount_freight = rec._compute_amount_all('freight')

    @api.depends('waybill_line_ids')
    def _compute_amount_move(self):
        for rec in self:
            rec.amount_move = rec._compute_amount_all('move')

    @api.depends('waybill_line_ids')
    def _compute_amount_highway_tolls(self):
        for rec in self:
            rec.amount_highway_tolls = rec._compute_amount_all('tolls')

    @api.depends('waybill_line_ids')
    def _compute_amount_insurance(self):
        for rec in self:
            rec.amount_insurance = rec._compute_amount_all('insurance')

    @api.depends('waybill_line_ids')
    def _compute_amount_other(self):
        for rec in self:
            rec.amount_other = rec._compute_amount_all('other')

    @api.depends('waybill_line_ids')
    def _compute_amount_untaxed(self):
        for waybill in self:
            waybill.amount_untaxed = 0

            for line in waybill.waybill_line_ids:
                waybill.amount_untaxed += line.price_subtotal

    @api.depends('waybill_line_ids')
    def _compute_amount_tax(self):
        for waybill in self:
            waybill.amount_tax = 0

            for line in waybill.waybill_line_ids:
                waybill.amount_tax += line.tax_amount

    @api.depends('amount_untaxed', 'amount_tax')
    def _compute_amount_total(self):
        for waybill in self:
            waybill.amount_total = waybill.amount_untaxed + waybill.amount_tax

    def action_confirm(self):
        for waybill in self:
            if not waybill.travel_ids:
                raise exceptions.ValidationError(
                    _('Could not confirm Waybill !'
                      'Waybill must be assigned to a Travel before '
                      'confirming.'))

            waybill.state = 'confirmed'

    @api.onchange('waybill_line_ids')
    def onchange_waybill_line_ids(self):
        for waybill in self:
            saved_tax_line_list = [(2, tax.id) for tax in waybill.tax_line_ids]
            waybill.write({'tax_line_ids': saved_tax_line_list})
            tax_grouped = {}

            for line in waybill.waybill_line_ids:
                unit_price = (line.unit_price * (1 - (line.discount or 0.0) / 100.0))
                taxes = line.tax_ids

                for tax in taxes:
                    unit_price = line.unit_price

                    val = {
                        'tax_id': tax.id,
                        'base': unit_price,
                        'tax_amount': (unit_price * tax.amount) / 100,
                        'waybill_id': waybill.id
                    }

                    if tax['id'] not in tax_grouped:
                        tax_grouped[tax['id']] = val
                    else:
                        tax_grouped[tax['id']]['tax_id'] = val['tax_id']
                        tax_grouped[tax['id']]['tax_amount'] += val['tax_amount']
                        tax_grouped[tax['id']]['base'] += val['base']
                        tax_grouped[tax['id']]['waybill_id'] = val['waybill_id']

            taxes_ordered = sorted(tax_grouped.values(), key=lambda x: x['tax_amount'], reverse=True)
            self.env['tms.waybill.taxes'].create(taxes_ordered)

    def action_cancel_draft(self):
        for waybill in self:
            for travel in waybill.travel_ids:
                if travel.state == 'cancel':
                    raise exceptions.ValidationError(
                        _('Could not set to draft this Waybill !'
                          'Travel is Cancelled !!!'))

            waybill.message_post(body=_("<h5><strong>Cancel to Draft</strong></h5>"))
            waybill.state = 'draft'

    def action_cancel(self):
        for waybill in self:
            if waybill.invoice_id and waybill.invoice_id.state != 'cancel':
                raise exceptions.ValidationError(
                    _('You cannot unlink the invoice of this waybill'
                        ' because the invoice is still valid, '
                        'please check it.'))
            else:
                waybill.invoice_id = False
                waybill.state = 'cancel'
                waybill.message_post(
                    body=_("<h5><strong>Cancelled</strong></h5>"))

    def _amount_to_text(self, amount_total, currency, partner_lang='es_MX'):
        total = str(float(amount_total)).split('.')[0]
        decimals = str(float(amount_total)).split('.')[1]
        currency_type = 'M.N.'

        if partner_lang != 'es_MX':
            total = num2words(float(amount_total)).upper()
        else:
            total = num2words(float(total), lang='es').upper()

        if currency != 'MXN':
            currency_type = 'M.E.'
        else:
            currency = 'PESOS'

        return '%s %s %s/100 %s' % (
            total, currency, decimals or 0.0, currency_type)

    def open_invoice_wizard(self):
        return {
            'name': _('Create Invoice'),
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            "view_type": "form",
            'res_model': 'tms.invoice.wizard',
            'target': 'new',
            'view_id': self.env.ref('tms.tms_invoice_wizard_view_form').id
    }
