/** @odoo-module **/

import { patch } from 'web.utils'
import PaymentScreen from 'point_of_sale.PaymentScreen'

patch(PaymentScreen.prototype, "getter/setter patch", {
    get nextScreen() {
        return !this.error ? 'ReceiptScreen' : 'ProducTemplateScreen'
    }
})
patch(PaymentScreen.prototype, "async prototype patch", {
    _finalizeValidation: async function() {
        let _super = this._super.bind(this)
        await this.env.pos.confirmCurrentOrderMrpProduction()
        await this.env.pos.fixQueueForCurrentOrder(3)
        await _super(...arguments)
    }
})
