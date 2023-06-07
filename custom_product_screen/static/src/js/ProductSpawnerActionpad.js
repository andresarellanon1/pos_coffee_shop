/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import Registries from 'point_of_sale.Registries'

class ProductSpawnerActionpad extends PosComponent {}
ProductSpawnerActionpad.template = 'custom_product_screen.ProductSpawnerActionpad';
Registries.Component.add(ProductSpawnerActionpad);

