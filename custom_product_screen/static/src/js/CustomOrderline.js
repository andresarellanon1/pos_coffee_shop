/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'

class CustomOrderline extends PosComponent {
}

CustomOrderline.template = 'custom_product_screen.CustomOrderline';
Registries.Component.add(CustomOrderline);

