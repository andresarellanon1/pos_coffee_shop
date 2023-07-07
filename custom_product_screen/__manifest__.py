{
    'name': 'Coffe shop',
    'version': '16.0.0.16',
    'category': 'point_of_sale',
    'description': 'Sobre escribe estilos y funcionalidad de componentes del punto de venta y agrega soporte para multiples pantallas (lectura-escritura y solo lectura)',
    'author': 'Quadro Soluciones',
    'images': [],
    'depends': ['point_of_sale', 'pos_enterprise', 'mrp', 'hr'],
    'installable': True,
    'data': [
        'security/ir.model.access.csv',
        'views/product_view.xml',
        'views/custom_screen_views.xml',
        'views/partner_inherit_view.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'custom_product_screen/static/src/xml/*.xml',
            'custom_product_screen/static/src/js/*.js',
            'custom_product_screen/static/src/css/*.css',
            'custom_product_screen/static/src/css/*.scss',
        ]
    }
}
