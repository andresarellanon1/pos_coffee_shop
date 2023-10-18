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
        'customer_tms_waybill.assets': [
            'customer_tms_waybill/static/src/xml/*.xml',
            'customer_tms_waybill/static/src/js/*.js',
            'customer_tms_waybill/static/src/css/dist/*.css',  # tailwind generated
            'customer_tms_waybill/static/src/css/*.css',
        ]
    }
}
