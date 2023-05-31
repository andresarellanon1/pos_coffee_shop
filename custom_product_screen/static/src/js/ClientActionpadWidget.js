/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import Registries from 'point_of_sale.Registries'

class ClientActionpadWidget extends PosComponent {}
ClientActionpadWidget.template = 'custom_product_screen.ClientActionpadWidget';
Registries.Component.add(ClientActionpadWidget);

