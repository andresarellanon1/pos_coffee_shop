/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Order, Orderline } from 'point_of_sale.models'

patch(PosGlobalState.prototype, "prototype patch", {
    _processData: async function(loadedData) {
        this._loadProductTemplate(loadedData['product.template'])
        this._loadMrpBom(loadedData['mrp.bom'])
        this._loadBomLines(loadedData['mrp.bom.line'])
        this._super(loadedData)
    },
    _loadProductTemplate: function(products) {
        this.db._isEmployee()
        this.db.add_products_templates(products)
    },
    _loadMrpBom: function(boms) {
        this.db.add_boms(boms)
    },
    _loadBomLines: function(lines) {
        this.db.add_bom_lines(lines)
    },
    add_new_order: function() {
        this.db.extra_components_by_orderline_id = {}
        this.db.products_to_sync_by_orderline_id = {}
        this.db.orderlines_to_sync_by_production_id = {}
        this.db.orderlineSkipMO = []
        this._super(...arguments)
    },
    createCurrentOrderMrpProduction: async function() {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let products_to_sync_by_orderline_id_keys = Object.keys(this.db.products_to_sync_by_orderline_id)
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            orderlines = orderlines.filter(orderline => !this.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            orderlines = orderlines.filter(orderline => products_to_sync_by_orderline_id_keys.includes(orderline.id))
            for (let key in products_to_sync_by_orderline_id) {
                for (let j = 0; j < orderlines[key].quantity; j++) {
                    let id = await rpc.query({
                        model: 'mrp.production',
                        method: 'create_single',
                        args: [1, {
                            'id': orderlines[key].product.id,
                            'qty': 1,
                            'product_tmpl_id': orderlines[key].product.product_tmpl_id,
                            'pos_reference': order.name,
                            'uom_id': orderlines[key].product.uom_id[0]
                        }],
                    })
                    this.db.add_orderline_to_sync_by_production_id(id, orderlines[key].id)
                }
            }
        } catch (e) {
            throw e
        }
    },
    confirmCurrentOrderMrpProduction: async function() {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let orderlines_to_sync_by_production_id = this.db.orderlines_to_sync_by_production_id
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let products_to_sync_by_orderline_id_keys = Object.keys(this.db.products_to_sync_by_orderline_id)
            orderlines = orderlines.filter(orderline => !this.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            orderlines = orderlines.filter(orderline => products_to_sync_by_orderline_id_keys.includes(orderline.id))
            for (let key in orderlines_to_sync_by_production_id) {
                let orderline_id = orderlines_to_sync_by_production_id[key].orderline_id
                await rpc.query({
                    model: 'mrp.production',
                    method: 'confirm_single',
                    args: [1, {
                        'id': orderlines[orderline_id].product.id,
                        'production_id': key,
                        'qty': 1,
                        'product_tmpl_id': orderlines[orderline_id].product.product_tmpl_id,
                        'pos_reference': order.name,
                        'uom_id': orderlines[orderline_id].product.uom_id[0],
                        'components': products_to_sync_by_orderline_id[orderline_id].extra_components
                    }],
                })
            }
        } catch (e) {
            throw e
        }
    },
    clearOrderMrpProduction: async function(order) {
        try {
            let orderlines = order.get_orderlines()
            let extras_orderlines_id = []
            let extra_components_by_orderline_id = this.db.extra_components_by_orderline_id
            for (let key in extra_components_by_orderline_id) {
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
    },
    clearSingleMrpProduction: async function(id) {
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
    },
    /*
    * NOTE: this method expects the orderlines to have a production id created and stored in memory beforehand
    */
    sendOrderToMainPoS: async function(retry) {
        try {
            await this.version(3)
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let orderlines_to_sync_by_production_id = this.orderlines_to_sync_by_production_id
            let orderlines = []
            for (let key in orderlines_to_sync_by_production_id) {
                let index = orderlines_to_sync_by_production_id[key].orderline_id
                orderlines.push({
                    production_id: key,
                    product_id: products_to_sync_by_orderline_id[index].product_id,
                    options: products_to_sync_by_orderline_id[index].options,
                    extra_components: products_to_sync_by_orderline_id[index].extra_components
                })
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
    },
    /*  
    * NOTE: only requires to fix on click pay for the orders created in the main PoS because the order uids haven't been pushed in the queue yet 
    * NOTE: the clent session method "sendOrder" does this internally when the order is sent to the queue
    */
    fixQueueForCurrentOrder: async function(retry) {
        try {
            await this.version()
            let order = this.currentOrder
            let uid = order.name
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
    },
    /*
    * NOTE: on fetching next order emulate the spawning of a new orderline but add it to the skipMO list
    */
    fetchOrderFromClientPoS: async function(retry) {
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
                await loadDataToCurrentOrder(payload)
            }
            if (retry > 0)
                await this.fetchOrderFromClientPoS(retry - 1)
        } catch (e) {
            throw e
        }
    },
    loadDataToCurrentOrder: async function(orderPayload) {
        try {
            this.currentOrder.name = orderPayload.name
            this.currentOrder.uid = orderPayload.uid
            for (let payload of orderPayload.orderlines) {
                let product = this.db.product_by_id[payload.product_id]
                let parent_orderline = await this._addProduct(product, payload.options)
                this.db.orderlineSkipMO.push(parent_orderline)
                for (let component of payload.extra_components) {
                    let extra = this.db.product_by_id[component.id]
                    let options = {
                        draftPackLotLines: undefined,
                        quantity: component.qty,
                        price_extra: 0.0,
                        description: extra.display_name,
                    }
                    let extra_components = await this._addProduct(extra, options)
                    this.db.add_extra_component_by_orderline_id(parent_orderline.id, extra_components.id, product.id, extra)
                }
                // NOTE: Emulate spawing orderline for product locally
                this.db.add_product_to_sync_by_orderline_id(parent_orderline.id, payload.product_id, payload.options, payload.extra_components)
                // NOTE: Emulate creating mrp.production locally 
                this.db.add_orderline_to_sync_by_production_id(payload.production_id, parent_orderline.id)
            }
            this.trigger('product-spawned')
            this.trigger('close-temp-screen')
        } catch (e) {
            throw e
        }
    },
    _addProduct: async function(product, options) {
        return await this.currentOrder.add_product_but_well_done(product, options)
    },
    version: async function(retry) {
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
})

patch(Order.prototype, "prototype patch", {
    add_product_but_well_done: async function(product, options, production_id) {
        this.assert_editable()
        options = options || {}
        var line = Orderline.create({}, { pos: this.pos, order: this, product: product })
        this.fix_tax_included_price(line)
        this.set_orderline_options(line, options)
        this.add_orderline(line)
        this.select_orderline(this.get_last_orderline())
        return Promise.resolve(line)
    },
    get_screen_data: function() {
        const screen = this.screen_data['value']
        if (!screen) {
            if (this.get_paymentlines().length > 0) return { name: 'PaymentScreen' }
            return { name: 'ProductTemplateScreen' }
        }
        if (!this.finalized && this.get_paymentlines().length > 0) {
            return { name: 'PaymentScreen' }
        }
        return screen
    }
})

patch(Order.prototype, "constructor patch", {
    setup() {
        this._super(...arguments)
    }
})
