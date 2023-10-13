/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'

class CustomActionpad extends PosComponent {
    get isEmployee() {
        return this.env.pos.db.isEmployee
    }
}
CustomActionpad.template = 'custom_product_screen.CustomActionpad'
Registries.Component.add(CustomActionpad)
