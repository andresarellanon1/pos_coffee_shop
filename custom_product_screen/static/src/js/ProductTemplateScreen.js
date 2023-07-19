/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import ControlButtonsMixin from 'point_of_sale.ControlButtonsMixin'
import Registries from 'point_of_sale.Registries'
import { useExternalListener, onMounted, useState } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'
import rpc from 'web.rpc'
import NumberBuffer from 'point_of_sale.NumberBuffer'

class ProductTemplateScreen extends ControlButtonsMixin(PosComponent) {
    setup() {

        super.setup()
        useExternalListener(window, 'click-pay', this._onClickPay)
        useExternalListener(window, 'click-send', this._onClickSend)
        useExternalListener(window, 'clear-order', this._onClearOrder)
        useExternalListener(window, 'click-sync-next-order', this._onClickNext)
        useExternalListener(window, 'product-spawned', this._onProductSpawned)
        useExternalListener(window, 'order-validated', this._onOrderValid)
        useListener('click-product', this._clickProduct)
        NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        })
        onMounted(this.onMounted)
    }
    onMounted() {
        NumberBuffer.reset()
        this.env.posbus.trigger('start-cash-control')
        if (!this.isEmployee)
            $(document).find('.pos-topheader').addClass('oe_hidden')
        let order = this.currentOrder
        this.env.pos.removeOrder(order)
        this.env.pos.add_new_order()
    }
    get currentOrder() {
        return this.env.pos.get_order()
    }
    get orderlineSkipMO() {
        return this.env.pos.db.orderlineSkipMO
    }
    get isEmployee() {
        return this.env.pos.db.isEmployee
    }
    // Handlers
    async _clickProduct(event) {
        let productTemplate = event.detail
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined)
        this.trigger('close-temp-screen')
        await this.showTempScreen("ProductSpawnerScreen", {
            product: productTemplate,
            attributes: attributes,
        })
    }
    async _onClearOrder(event) {
        try {
            this.trigger('show-loader')
            let order = this.currentOrder
            this.env.pos.removeOrder(order)
            this.env.pos.add_new_order()
            this.trigger('hide-loader')
        } catch (e) {
            this.trigger('hide-loader')
            this.showPopup('ErrorPopup', {
                title: 'Error al cancelar orden',
                body: e
            })
            console.error(e)
        }
    }
    /*
   * NOTE: Call on main PoS session
   */
    async _onClickPay(event) {
        try {
            this.trigger('show-loader')
            await this.env.pos.createCurrentOrderMrpProduction()
            await this.env.pos.fixQueueForCurrentOrder(3)
            for (let key in this.env.pos.db.extra_components_by_orderline_id) {
                let orderline = this.currentOrder.orderlines.find(or => or.id === this.env.pos.db.extra_components_by_orderline_id[key].orderline_id)
                this.currentOrder.remove_orderline(orderline)
            }
            this.showScreen('PaymentScreen')
            this.trigger('hide-loader')
        } catch (e) {
            this.trigger('hide-loader')
            this.showPopup('ErrorPopup', {
                title: 'Error al preparar pantalla de cobro',
                body: e
            })
            console.error(e)
        }
    }
    /*
    * NOTE: Call on main PoS session
    */
    async _onOrderValid(event) {
        let orderName = event.detail
            }
    /*
    * NOTE: Call on main PoS session
    */
    async _onClickNext(event) {
        try {
            this.trigger('show-loader')
            let order = this.currentOrder
            this.env.pos.removeOrder(order)
            this.env.pos.add_new_order()
            await this.fetchOrderFromClientPoS(3)
            this.trigger('hide-loader')
        } catch (e) {
            this.trigger('hide-loader')
            this.showPopup('ErrorPopup', {
                title: 'Error al cargar orden desde la session remota',
                body: e
            })
            console.error(e)
        }
    }
    /*
    * NOTE: on sending the current order to the main PoS it's required to create and inmediately confirm the mrp.production
    * NOTE: Call on client PoS session
    */
    async _onClickSend(event) {
        try {
            this.trigger('show-loader')
            await this.env.pos.createCurrentOrderMrpProduction()
            await this.env.pos.confirmCurrentOrderMrpProduction()
            await this.env.pos.sendOrderToMainPoS(3)
            let order = this.currentOrder
            this.env.pos.removeOrder(order)
            this.env.pos.add_new_order()
            this.trigger('hide-loader')
        } catch (e) {
            this.trigger('hide-loader')
            this.showPopup('ErrorPopup', {
                title: 'Error al enviar orden a la session remota',
                body: e
            })
            console.error(e)
        }
    }
    // CALLED ON ANY SESSION WHEN THE PRODUCT SPAWNS 
    async _onProductSpawned(event) {
        NumberBuffer.reset()
        this.trigger('hide-loader')
    }

}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen'
Registries.Component.add(ProductTemplateScreen)
