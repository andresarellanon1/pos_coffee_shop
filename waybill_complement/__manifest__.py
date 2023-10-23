# -*- coding: utf-8 -*-
{
    'name': 'Waybill Complement',
    'version': '16.0.0.0.3',
    'category': 'Invoice',
    'summary': 'Waybill complement module',
    'author': 'Quadro Soluciones',
    'website': 'https://quadrosoluciones.com/',
    "license": "LGPL-3",
    'depends': [
        'account_accountant',
        'tms',
        'fleet',
        'l10n_mx_edi_40'
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/cfdi40_waybill_complement20.xml',
        'views/colony_views.xml',
        'views/fleet_vehicle_configuration_views.xml',
        'views/fleet_vehicle_trailer_subtype_views.xml',
        'views/fleet_vehicle_views.xml',
        'views/hazardous_material_views.xml',
        'views/packaging_views.xml',
        'views/postal_code_views.xml',
        'views/res_partner_views.xml',
        'views/sat_merchandise_code_views.xml',
        'views/tms_waybill_views.xml',
        'views/views_menu_items.xml'
    ],
    'application': False,
    'installable': True,
}
