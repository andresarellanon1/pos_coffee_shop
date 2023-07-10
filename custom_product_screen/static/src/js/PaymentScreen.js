/** @odoo-module **/

import { patch } from 'web.utils'
import PaymentScreen from 'point_of_sale.PaymentScreen'

patch(PaymentScreen.prototype, "getter/setter patch", {
    get nextScreen() {
        return !this.error ? 'ReceiptScreen' : 'ProducTemplateScreen'
    }
})
