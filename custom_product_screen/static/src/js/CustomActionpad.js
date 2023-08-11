/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'

class CustomActionpad extends PosComponent { }
CustomActionpad.template = 'custom_product_screen.CustomActionpad'
Registries.Component.add(CustomActionpad)