{
    'name': 'Coffe shop',
    'version': '16.0.0.9',
    'category': '',
    'description': 'Sobre escribe estilos y funcionalidad de componentes del punto de venta y agrega soporte para multiples pantallas (lectura-escritura y solo lectura)',
    'author': 'Quadro Soluciones',
    'images': [],
    'depends': ['point_of_sale', 'pos_enterprise'],
    'installable': True,
    'assets': {
        'web.assets_backend': [
            'custom_product_screen/static/src/**/*.js',
        ],
        'web.assets_qweb': [
            'custom_product_screen/static/src/**/*.xml',
        ]
    }
}
