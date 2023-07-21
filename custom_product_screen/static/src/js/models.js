/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Order, Orderline } from 'point_of_sale.models'
import rpc from 'web.rpc'

patch(PosGlobalState.prototype, "getter/setter patch", {
    get currentOrder() {
        return this.get_order()
    }
})
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
        this.db.child_orderline_by_orderline_id = {}
        this.db.products_to_sync_by_orderline_id = {}
        this.db.orderlines_to_sync_by_production_id = {}
        this.db.orderlineSkipMO = []
        this._super(...arguments)
    },
    createCurrentOrderMrpProduction: async function() {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let orderlines_to_sync_by_production_id = this.db.orderlines_to_sync_by_production_id
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let products_to_sync_by_orderline_id_keys = Object.keys(products_to_sync_by_orderline_id)
            orderlines = orderlines.filter(orderline => !this.db.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            orderlines = orderlines.filter(orderline => products_to_sync_by_orderline_id_keys.includes(`${orderline.id}`))
            for (let key in orderlines_to_sync_by_production_id) {
                let orderline_id = orderlines_to_sync_by_production_id[key].orderline_id
                let orderline = orderlines.find(line => line.id === orderline_id)
                let id = await rpc.query({
                    model: 'mrp.production',
                    method: 'create_single',
                    args: [1, {
                        'id': orderline.product.id,
                        'production_id': orderlines_to_sync_by_production_id[key].production_id,
                        'qty': 1,
                        'product_tmpl_id': orderline.product.product_tmpl_id,
                        'pos_reference': order.name,
                        'uom_id': orderline.product.uom_id[0],
                        'components': products_to_sync_by_orderline_id[orderline_id].extra_components
                    }],
                })
                this.db.add_orderline_to_sync_by_production_id(id, line.id)
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
            let products_to_sync_by_orderline_id_keys = Object.keys(products_to_sync_by_orderline_id)
            orderlines = orderlines.filter(orderline => !this.db.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            orderlines = orderlines.filter(orderline => products_to_sync_by_orderline_id_keys.includes(`${orderline.id}`))
            for (let key in orderlines_to_sync_by_production_id) {
                let orderline_id = orderlines_to_sync_by_production_id[key].orderline_id
                let orderline = orderlines.find(line => line.id === orderline_id)
                await rpc.query({
                    model: 'mrp.production',
                    method: 'confirm_single',
                    args: [1, {
                        'id': orderline.product.id,
                        'production_id': orderlines_to_sync_by_production_id[key].production_id,
                    }],
                })
            }
        } catch (e) {
            throw e
        }
    },
    // NOTE: Clears mrp production for the current matching origin (order name)
    clearCurrentOrderMrpProduction: async function() {
        try {
            let origin = `POS-${this.currentOrder.name}`
            let production_ids = await rpc.query({
                model: 'mrp.production',
                method: 'search',
                args: [['origin', '=', origin]]
            })
            if (production_ids.lenght === 0 || production_ids === null) return
            console.warn('clearing current production ids')
            console.log(production_ids)
            await rpc.query({
                model: 'mrp.production',
                method: 'unlink',
                args: [1, production_ids],
            })
        } catch (e) {
            throw e
        }
    },
    clearSingleMrpProduction: async function(orderline_id) {
        try {
            let orderlines_to_sync_by_production_id = this.db.orderlines_to_sync_by_production_id
            for (let key in orderlines_to_sync_by_production_id) {
                if (orderlines_to_sync_by_production_id[key].orderline_id !== orderline_id) continue
                let production_ids = await rpc.query({
                    model: 'mrp.production',
                    method: 'search',
                    args: [['id', '=', orderlines_to_sync_by_production_id[key].production_id]]
                })
                await rpc.query({
                    model: 'mrp.production',
                    method: 'unlink',
                    args: [1, production_ids],
                })
                break
            }
        } catch (e) {
            throw e
        }
    },
    /*
    * NOTE: this method expects the orderlines to have a production id created and stored in memory beforehand
    */
    sendOrderToMainPoS: async function(retry) {
        try {
            await this.fetchVersion(3)
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let orderlines_to_sync_by_production_id = this.orderlines_to_sync_by_production_id
            let orderlines = []
            for (let key in orderlines_to_sync_by_production_id) {
                let index = orderlines_to_sync_by_production_id[key].orderline_id
                orderlines.push({
                    production_id: orderlines_to_sync_by_production_id[key].production_id,
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
    * NOTE: the client session method "sendOrderToMainPoS" does this as a side effect on its backend handler
    */
    fixQueueForCurrentOrder: async function(retry) {
        try {
            await this.fetchVersion(3)
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
            await this.fetchVersion(3)
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
            })
            if (response.status === 200) {
                let payload = await response.json()
                console.log(payload)
                return await this.loadDataToCurrentOrder(payload)
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
            console.warn('loading order')
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
                    let child_orderline = await this._addProduct(extra, options)
                    this.db.add_extra_component_by_orderline_id(parent_orderline.id, child_orderline.id)
                }
                // NOTE: Emulate spawing orderline for product locally (from method spawnProduct)
                this.db.add_product_to_sync_by_orderline_id(parent_orderline.id, payload.product_id, payload.options, payload.extra_components)
                // NOTE: Emulate creating mrp.production locally  (from method createCurrentOrderMrpProduction)
                this.db.add_orderline_to_sync_by_production_id(payload.production_id, parent_orderline.id)
            }
            console.log(this.currentOrder)
        } catch (e) {
            throw e
        }
    },
    _addProduct: async function(product, options) {
        return await this.currentOrder.add_product_but_well_done(product, options)
    },
    fetchVersion: async function(retry) {
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
                await this.fetchVersion(retry - 1)
        } catch (e) {
            throw e
        }
    }
})

patch(Order.prototype, "prototype patch", {
    add_product_but_well_done: async function(product, options) {
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
