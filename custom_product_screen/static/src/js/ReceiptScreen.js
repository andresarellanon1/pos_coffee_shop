/** @odoo-module **/

import ReceiptScreen from 'point_of_sale.ReceiptScreen'
import { patch } from 'web.utils'

patch(ReceiptScreen.prototype, "getter/setter patch", {
    get nextScreen() {
        return { name: 'ProductTemplateScreen' };
    }
});
