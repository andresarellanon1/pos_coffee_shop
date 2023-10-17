# -*- coding: utf-8 -*-
from odoo import _, api, fields, models

class TmsTransportable(models.Model):
    _name = 'tms.transportable'
    _description = 'Transportable Product'

    name = fields.Char(required=True, translate=True)
    uom_id = fields.Many2one('uom.uom', 'Unit of Measure ', required=True)

    def copy(self, default=None):
        default = dict(default or {})
        copied_count = self.search_count(
            [('name', '=like', u"Copy of [%(values)s]" % dict(
                values=self.name))])

        if not copied_count:
            new_name = u"Copy of [%(values)s]" % dict(values=self.name)
        else:
            new_name = u"Copy of [%(values)s]" % dict(
                values=", ".join([self.name, str(copied_count)]))

        default['name'] = new_name
        return super(TmsTransportable, self).copy(default)

    _sql_constraints = [
        ('name_unique',
         'UNIQUE(name)',
         _("Name must be unique")),
    ]
