/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'

class ProductSpawnerWidget extends PosComponent {}
ProductSpawnerWidget.template = 'custom_product_screen.ProductSpawnerWidget';
Registries.Component.add(ProductSpawnerWidget);

