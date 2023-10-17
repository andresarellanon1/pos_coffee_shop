# -*- coding: utf-8 -*-
from lxml import etree
from odoo import api, fields, models, _
import logging

_logger = logging.getLogger(__name__)

class TmsExtradata(models.Model):
    _name = "tms.extradata"
    _description = "Extra Data"

    type_id = fields.Many2one('tms.extradata.type', string="Type", required="True")
    type = fields.Selection(string='', related="type_id.type")
    value_char = fields.Char('Value')
    value_integer = fields.Integer('Value')
    value_float = fields.Float('Value')
    value_date = fields.Date('Value')
    value_datetime = fields.Datetime('Value')
    value_extra = fields.Text('Value')
    waybill_id = fields.Many2one('tms.waybill', 'Waybill', ondelete='cascade')
    vehicle_id = fields.Many2one('fleet.vehicle', 'Vehicle', ondelete='cascade')

    @api.onchange('value_char', 'value_integer', 'value_float',
                  'value_date', 'value_datetime', 'value_extra')
    def onchange_value(self):
        values = [
            ['char', self.value_char],
            ['integer', str(self.value_integer)],
            ['float', str(self.value_float)],
            ['date', self.value_date],
            ['datetime', self.value_datetime]
        ]

        for value in values:
            if self.type == value[0]:
                self.value_extra = value[1]

    @api.model
    def get_view(self, view_id=None, view_type='form', **options):
        res = super(TmsExtradata, self).get_view(view_id=view_id, view_type=view_type, **options)

        if 'active_model_base' in self._context:
            doc = etree.XML(res['arch'])
            active_model = self._context['active_model_base']

            for node in doc.xpath("//field[@name='type_id']"):
                if active_model == 'fleet.vehicle':
                    node.set('domain', "[('apply_on', '=', 'unit')]")
                    node.set('context', "{'active_model': 'fleet.vehicle'}")
                elif active_model == 'tms.waybill':
                    node.set('domain', "[('apply_on', '=', 'waybill')]")
                    node.set('context', "{'active_model': 'tms.waybill'}")

            res['arch'] = (etree.tostring(doc))
        return res
