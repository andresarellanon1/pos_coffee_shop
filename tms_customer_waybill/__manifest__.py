{
    'name': 'Customer TMS waybill completent',
    'version': '16.0.0.0',
    'category': 'Extra Tools',
    'description': 'Consumes q_endpoints to perform REST actions on TMS Waybills for customer apis.',
    'author': 'Quadro Soluciones',
    'images': [],
    'depends': ['q_endpoint_catalog', 'tms'],
    'installable': True,
    'application': True,
    'data': [
        'security/ir.model.access.csv',
        'wizards/tms_customer_waybill_views.xml',
        'views/actions.xml',
        'views/menus.xml',
    ],
    'assets': {
        'web.assets_common': [
            'tms_customer_waybill/static/src/xml/*.xml',
            'tms_customer_waybill/static/src/js/*.js',
            'tms_customer_waybill/static/src/css/dist/*.css',  # tailwind generated
            'tms_customer_waybill/static/src/css/*.css',
        ]
    }
}
