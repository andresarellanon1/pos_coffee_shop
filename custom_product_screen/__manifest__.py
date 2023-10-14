{
    'name': 'Coffee Shop PoS',
    'version': '16.0.0.17',
    'category': 'point_of_sale',
    'description': 'Overrides the default point of sale to operate as a coffee shop PoS with mrp and stock workflows integrated. Support for external kitchen screen and share order between PoS sessions via external web service (XML-RPC).',
    'author': 'Quadro Soluciones',
    'images': [],
    'depends': ['point_of_sale', 'pos_enterprise', 'mrp', 'stock', 'pos_hr', 'q_endpoint_catalog'],
    'installable': True,
    'data': [
        'security/ir.model.access.csv',
        'views/product_view.xml',
        'views/partner_inherit_view.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'custom_product_screen/static/src/xml/*.xml',
            'custom_product_screen/static/src/js/*.js',
            'custom_product_screen/static/src/img/*.png',
            'custom_product_screen/static/src/css/dist/*.css',
            'custom_product_screen/static/src/css/*.css',
        ]
    }
}
