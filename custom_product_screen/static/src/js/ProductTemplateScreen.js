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
        useListener('click-product', this._clickProduct)
        NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        })
        onMounted(this.onMounted)
        onMounted(() => NumberBuffer.reset())        this.state = useState({
            orderlineSkipMO: [],
        })

    }
    onMounted() {
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
        return this.state.orderlineSkipMO
    }
    get isEmployee() {
        return this.env.pos.db.isEmployee
    }
    // Handlers
    async _onProductSpawned(event) {
        NumberBuffer.reset()
        this.trigger('hide-loader')
    }
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
            await this._clearMO(order)
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
    async _onClickPay(event) {
        try {
            this.trigger('show-loader')
            // TODO: wait for paymentScreen validate order to create MO 
            // TODO: Abstract reusable logic to db or main pos state 
            await this._createMO()
            // NOTE: only requires to fix on click pay for the orders created in the main PoS because the order uids haven't been pushed in the queue yet
            // NOTE: the clent session method "sendOrder" does this internally when the order is sent to the queue
            await this._fixQueue(3)
            this.state.orderlineSkipMO = []
            for (let key in this.env.pos.db.products_extra_by_orderline) {
                let orderline = this.currentOrder.orderlines.find(or => or.id === this.env.pos.db.products_extra_by_orderline[key].orderline_id)
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
    async _onClickSend(event) {
        try {
            this.trigger('show-loader')
            await this._createMO()
            await this._sendOrder(3)
            this.state.orderlineSkipMO = []
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
    async _onClickNext(event) {
        try {
            this.trigger('show-loader')
            this.state.orderlineSkipMO = []
            let order = this.currentOrder
            this.env.pos.removeOrder(order)
            this.env.pos.add_new_order()
            let payload = await this._fetchOrder(3)
            await this._loadOrder(payload)
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
    // operations
    async version(retry) {
        try {
            let response = await fetch("http://158.69.63.47:8080/version", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Content-Type": "*"
                },
            })
            if (response.status === 200)
                return
            if (retry > 0)
                await this.version(retry - 1)
        } catch (e) {
            throw e
        }
    }
    async _createMO() {
        try {
            let list_product = []
            let child_orderline = []
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let extras_orderlines_id = []
            let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline
            orderlines = orderlines.filter(orderline => !this.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            for (let index in orderlines) {
                for (let key in product_extra_by_orderline) {
                    if (product_extra_by_orderline[key].orderline_id === orderlines[index].id)
                        child_orderline.push({
                            'id': orderlines[index].product.id,
                            'qty': orderlines[index].quantity,
                        })
                }
            }
            for (let key in product_extra_by_orderline) {
                extras_orderlines_id.push(key)
            }
            orderlines = orderlines.filter(or => !extras_orderlines_id.includes(or.id))
            for (let i in orderlines) {
                for (let j = 0; j < orderlines[i].quantity; j++) {
                    list_product.push({
                        'id': orderlines[i].product.id,
                        'qty': 1,
                        'product_tmpl_id': orderlines[i].product.product_tmpl_id,
                        'pos_reference': order.name,
                        'uom_id': orderlines[i].product.uom_id[0],
                        'components': child_orderline
                    })
                }
            }
            if (list_product.length === 0)
                return
            let id = await rpc.query({
                model: 'mrp.production',
                method: 'create_single_from_list',
                args: [1, list_product],
            })
            this.env.pos.db.orderlines_to_sync_by_production_id
        } catch (e) {
            throw e
        }
    }
    async _clearProductionOrder(order) {
        try {
            let orderlines = order.get_orderlines()
            let extras_orderlines_id = []
            let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline
            for (let key in product_extra_by_orderline) {
                extras_orderlines_id.push(key)
            }
            orderlines = orderlines.filter(or => !extras_orderlines_id.includes(or.id))
            let origin = `POS-${order.name}`
            let production_ids = await this.rpc({
                model: 'mrp.production',
                method: 'search',
                args: [['origin', '=', origin]]
            })
            await rpc.query({
                model: 'mrp.production',
                method: 'unlink',
                args: [1, production_ids],
            })
        } catch (e) {
            this.showPopup('ErrorPopup', {
                title: 'Error al eliminar la order de manufactura en el sistema. Se esta eliminando del PoS.',
                body: e
            })
            console.error(e)
        }
    }
    async _clearProduction(id) {
        try {
            let production_ids = await this.rpc({
                model: 'mrp.production',
                method: 'search',
                args: [['id', '=', id]]
            })
            await rpc.query({
                model: 'mrp.production',
                method: 'unlink',
                args: [1, production_ids],
            })
        } catch (e) {
            this.showPopup('ErrorPopup', {
                title: 'Error al eliminar la order de manufactura en el sistema. Se esta eliminando del PoS.',
                body: e
            })
            console.error(e)
        }
    }
    async _sendOrder(retry) {
        try {
            await this.version(3)
            let orderlines_to_sync_by_production_id = this.env.pos.db.orderlines_to_sync_by_production_id
            let orderlines = []
            for (let key in orderlines_to_sync_by_production_id) {
                orderlines.push(orderlines_to_sync_by_production_id[key])
            }
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: this.currentOrder.name,
                    uid: this.currentOrder.uid,
                    orderlines: orderlines,
                })
            })
            this.trigger('hide-loader')
            if (response.status === 200)
                return
            if (retry > 0)
                await this._sendOrder(retry - 1)
        } catch (e) {
            throw e
        }
    }
    async _fixQueue(retry) {
        try {
            await this.version()
            let order = this.currentOrder
            let uid = order.name // this icludes de Order-uid format
            let response = await fetch("http://158.69.63.47:8080/setNextProduction", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uid: `POS-${uid}` })
            })
            if (response.status === 200)
                return
            if (retry > 0)
                await this._fixQueue(retry - 1)
        } catch (e) {
            throw e
        }
    }
    async _fetchOrder(retry) {
        try {
            await this.version()
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
            })
            if (response.status === 200) {
                let payload = await response.json()
                return payload
            }
            if (retry > 0)
                await this._fetchOrder(retry - 1)
        } catch (e) {
            throw e
        }
    }
    async _loadOrder(orderPayload) {
        try {
            this.currentOrder.name = orderPayload.name
            this.currentOrder.uid = orderPayload.uid
            for (let payload of orderPayload.orderlines) {
                let product = this.env.pos.db.product_by_id[payload.product_id]
                let parent_orderline = await this._addProduct(product, payload.options)
                this.state.orderlineSkipMO.push(parent_orderline)
                for (let component of payload.extra_components) {
                    let extra = this.env.pos.db.product_by_id[component.product_id]
                    let options = {
                        draftPackLotLines: undefined,
                        quantity: component.qty,
                        price_extra: 0.0,
                        description: extra.display_name,
                    }
                    let child_orderline = await this._addProduct(extra, options, payload.production_id)
                    this.env.pos.db.add_extra_component_by_orderline_id(parent_orderline.id, child_orderline.id, product.id, extra)
                }
            }
            this.trigger('product-spawned')
            this.trigger('close-temp-screen')
        } catch (e) {
            throw e
        }
    }
    async _addProduct(product, options, production_id) {
        try {
            return await this.currentOrder.add_product_but_well_done(product, options, production_id)
        } catch (e) {
            throw e
        }
    }
}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen'
Registries.Component.add(ProductTemplateScreen)
