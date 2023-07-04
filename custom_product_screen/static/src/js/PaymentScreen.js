/** @odoo-module **/

import PaymentScreen from 'point_of_sale.PaymentScreen'
import { patch } from 'web.utils'

patch(PaymentScreen.prototype, "getter/setter patch", {
    get nextScreen() {
        return !this.error ? 'ReceiptScreen' : 'ProducTemplateScreen';
    }
});
