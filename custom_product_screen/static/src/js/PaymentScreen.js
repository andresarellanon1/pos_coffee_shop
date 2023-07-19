/** @odoo-module **/

import { patch } from 'web.utils'
import PaymentScreen from 'point_of_sale.PaymentScreen'

patch(PaymentScreen.prototype, "getter/setter patch", {
    get nextScreen() {
        return !this.error ? 'ReceiptScreen' : 'ProducTemplateScreen'
    }
})
patch(PaymentScreen.prototype, "prototype patch", {
    _finalizeValidation: async function() {
        await this.env.pos.confirmCurrentOrderMrpProduction()
        await this.env.pos.fixQueueForCurrentOrder(3)
        this._super()
    }
})
