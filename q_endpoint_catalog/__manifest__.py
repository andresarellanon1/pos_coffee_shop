{
    'name': 'REST Endpoint Catalog',
    'version': '16.0.0.3',
    'category': 'Extra Tools',
    'description': 'Manages a catalog of REST endpoints. Define URL, Method, Body, Response, Headers and hardcode Authorization (or not). Call from python functions or modules on demand. ',
    'author': 'Quadro Soluciones',
    'images': [],
    'depends': ['base', 'contacts'],
    'installable': True,
    'application': True,
    'data': [
        'security/ir.model.access.csv',
        'views/body_views.xml',
        'views/response_views.xml',
        'views/header_views.xml',
        'views/endpoint_views.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            # 'q_endpoint_catalog/static/src/xml/*.xml',
            # 'q_endpoint_catalog/static/src/js/*.js',
            # 'q_endpoint_catalog/static/src/css/dist/*.css',  # tailwind generated
            # 'q_endpoint_catalog/static/src/css/*.css',
        ]
    }
}
