/** @odoo-module **/

import { patch } from 'web.utils'
import TicketScreen from 'point_of_sale.TicketScreen'

patch(TicketScreen.prototype, "prototype patch", {
    _onCreateNewOrder: function () {
        this.env.pos.add_new_order()
        this.showScreen('ProductTemplateScreen')
    },
    _getScreenToStatusMap: function () {
        return {
            ProductTemplateScreen: 'ONGOING',
            PaymentScreen: 'PAYMENT',
            ReceiptScreen: 'RECEIPT',
        }
    },
    _onDeleteOrder: async function ({ detail: order }) {
        const screen = order.get_screen_data()
        if (['ProductTemplateScreen', 'PaymentScreen'].includes(screen.name) && order.get_orderlines().length > 0) {
            const { confirmed } = await this.showPopup('ConfirmPopup', {
                title: this.env._t('Existing orderlines'),
                body: _.str.sprintf(
                    this.env._t('%s has a total amount of %s, are you sure you want to delete this order ?'),
                    order.name, this.getTotal(order)
                ),
            })
            if (!confirmed) return
        }
        if (order && (await this._onBeforeDeleteOrder(order))) {
            if (order === this.env.pos.get_order()) {
                this._selectNextOrder(order)
            }
            this.env.pos.removeOrder(order)
        }
    }
})

