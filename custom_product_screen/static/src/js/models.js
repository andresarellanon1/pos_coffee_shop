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
    _processData: async function (loadedData) {
        this._loadProductTemplate(loadedData['product.template'])
        this._loadMrpBom(loadedData['mrp.bom'])
        this._loadBomLines(loadedData['mrp.bom.line'])
        this._super(loadedData)
    },
    _loadProductTemplate: function (products) {
        this.db._isEmployee()
        this.db.add_products_templates(products)
    },
    _loadMrpBom: function (boms) {
        this.db.add_boms(boms)
    },
    _loadBomLines: function (lines) {
        this.db.add_bom_lines(lines)
    },
    add_new_order: function () {
        this.db.child_orderline_by_orderline_id = {}
        this.db.products_to_sync_by_orderline_id = {}
        this.db.orderlines_to_sync_by_production_id = {}
        this.db.orderlineSkipMO = []
        this._super(...arguments)
    },
    createCurrentOrderMrpProduction: async function () {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let products_to_sync_by_orderline_id_keys = Object.keys(products_to_sync_by_orderline_id)
            orderlines = orderlines.filter(orderline => !this.db.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            orderlines = orderlines.filter(orderline => products_to_sync_by_orderline_id_keys.includes(`${orderline.id}`))
            if (orderlines.lenght === 0) return
            for (let key in products_to_sync_by_orderline_id) {
                let orderline = orderlines.find(line => line.id === products_to_sync_by_orderline_id[key].orderline_id)
                if (!orderline) continue
                let argBody = {
                    'id': orderline.product.id,
                    'qty': 1,
                    'product_tmpl_id': orderline.product.product_tmpl_id,
                    'pos_reference': order.name,
                    'uom_id': orderline.product.uom_id[0],
                    'components': products_to_sync_by_orderline_id[orderline.id].extra_components
                }
                let id = await rpc.query({
                    model: 'mrp.production',
                    method: 'create_single',
                    args: [1, argBody],
                })
                this.db.add_orderline_to_sync_by_production_id(id, orderline.id)
            }
        } catch (e) {
            throw e
        }
    },
    confirmCurrentOrderMrpProduction: async function () {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let orderlines_to_sync_by_production_id = this.db.orderlines_to_sync_by_production_id
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let products_to_sync_by_orderline_id_keys = Object.keys(products_to_sync_by_orderline_id)
            orderlines = orderlines.filter(orderline => !this.db.orderlineSkipMO.map(line => line.id).includes(orderline.id))
            orderlines = orderlines.filter(orderline => products_to_sync_by_orderline_id_keys.includes(`${orderline.id}`))
            if (orderlines.lenght === 0) return
            for (let key in orderlines_to_sync_by_production_id) {
                let orderline_id = orderlines_to_sync_by_production_id[key].orderline_id
                let orderline = orderlines.find(line => line.id === orderline_id)
                if (!orderline) continue
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
    clearCurrentOrderMrpProduction: async function () {
        try {
            let origin = `POS-${this.currentOrder.name}`
            let production_ids = await rpc.query({
                model: 'mrp.production',
                method: 'search',
                args: [[['origin', '=', origin]]]
            })
            if (production_ids.lenght === 0 || production_ids === null) return
            await rpc.query({
                model: 'mrp.production',
                method: 'unlink',
                args: [production_ids],
            })
        } catch (e) {
            throw e
        }
    },
    clearSingleMrpProduction: async function (orderline_id) {
        try {
            let orderlines_to_sync_by_production_id = this.db.orderlines_to_sync_by_production_id
            if (!this.db.orderlineSkipMO.map(line => line.id).includes(orderline_id)) return
            for (let key in orderlines_to_sync_by_production_id) {
                if (orderlines_to_sync_by_production_id[key].orderline_id !== orderline_id) continue
                let production_ids = await rpc.query({
                    model: 'mrp.production',
                    method: 'search',
                    args: [[['id', '=', orderlines_to_sync_by_production_id[key].production_id]]]
                })
                await rpc.query({
                    model: 'mrp.production',
                    method: 'unlink',
                    args: [production_ids],
                })
                break
            }
        } catch (e) {
            throw e
        }
    },
    /*
    * NOTE: this method expects the orderlines to have a production id created and stored in memory 
    */
    sendOrderToMainPoS: async function (retry) {
        try {
            await this.fetchVersion(2)
            let products_to_sync_by_orderline_id = this.db.products_to_sync_by_orderline_id
            let orderlines_to_sync_by_production_id = this.db.orderlines_to_sync_by_production_id
            let orderlines = []
            for (let key in orderlines_to_sync_by_production_id) {
                let index = orderlines_to_sync_by_production_id[key].orderline_id
                let body = {
                    production_id: orderlines_to_sync_by_production_id[key].production_id,
                    product_id: products_to_sync_by_orderline_id[index].product_id,
                    options: products_to_sync_by_orderline_id[index].options,
                    extra_components: products_to_sync_by_orderline_id[index].extra_components
                }
                orderlines.push(body)
            }
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Authorization": this.db.auth,
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
                await this.sendOrderToMainPoS(retry - 1)
        } catch (e) {
            throw e
        }
    },
    /*  
    * NOTE: only requires to fix on click pay for the orders created in the main PoS because the order uids haven't been pushed in the queue yet 
    * NOTE: the client session method "sendOrderToMainPoS" does this as a side effect on its backend handler
    */
    fixQueueForCurrentOrder: async function (retry) {
        try {
            await this.fetchVersion(3)
            let order = this.currentOrder
            let uid = order.name
            let orderlines_ids = order.get_orderlines().map(line => line.id)
            let orderlinesRemote_ids = this.db.orderlineSkipMO.map(line => line.id)
            let isFix = orderlines_ids.every(line_id => orderlinesRemote_ids.includes(line_id))
            if (isFix) return
            let response = await fetch("http://158.69.63.47:8080/setNextProduction", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Authorization": this.db.auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uid: `POS-${uid}` })
            })
            if (response.status === 200)
                return
            if (retry > 0)
                await this.fixQueueForCurrentOrder(retry - 1)
        } catch (e) {
            throw e
        }
    },
    fetchOrderFromClientPoS: async function (retry) {
        try {
            await this.fetchVersion(3)
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Authorization": this.db.auth,
                    "Content-Type": "application/json"
                },
            })
            if (response.status === 200) {
                let payload = await response.json()
                return await this.loadDataToCurrentOrder(payload)
            }
            if (retry > 0)
                await this.fetchOrderFromClientPoS(retry - 1)
        } catch (e) {
            throw e
        }
    },
    loadDataToCurrentOrder: async function (orderPayload) {
        try {
            this.currentOrder.name = orderPayload.name
            this.currentOrder.uid = orderPayload.uid
            for (let payload of orderPayload.orderlines) {
                let product = this.db.product_by_id[payload.product_id]
                let parent_orderline = await this.currentOrder.add_product_prosime_resolve(product, payload.options)
                this.db.orderlineSkipMO.push(parent_orderline)
                for (let component of payload.extra_components) {
                    let extra = this.db.product_by_id[component.id]
                    let options = {
                        draftPackLotLines: undefined,
                        quantity: component.qty,
                        price_extra: 0.0,
                        description: extra.display_name,
                    }
                    let child_orderline = await this.currentOrder.add_product_prosime_resolve(extra, options)
                    this.db.add_child_orderline_by_orderline_id(parent_orderline.id, child_orderline.id)
                }
                this.db.add_product_to_sync_by_orderline_id(parent_orderline.id, payload.product_id, payload.options, payload.extra_components)
                this.db.add_orderline_to_sync_by_production_id(payload.production_id, parent_orderline.id)
            }
        } catch (e) {
            throw e
        }
    },
    fetchVersion: async function (retry) {
        try {
            let response = await fetch("http://158.69.63.47:8080/version", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Authorization": this.db.auth,
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
    },
    login: async function (user_id, password, retry) {
        try {
            let user = await rpc.query({
                model: 'res.users',
                method: 'read',
                args: [user_id, ['login']],
            })
            if (user && user[0] && user[0].login) {
                let response = await fetch("http://158.69.63.47:8080/login", {
                    method: "POST",
                    headers: {
                        "Accept": "*",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ user: user[0].login, password: password })
                })
                if (response.status === 200) {
                    let token = await response.json()
                    this.db.auth = token
                    return true
                }
                if (retry > 0)
                    await this.fixQueueForCurrentOrder(retry - 1)
            }
            return false
        } catch (e) {
            throw e
        }
    },
    dupeSpawn: async function (orderline) {
        let product = this.db.product_by_id[orderline.product.id]
        let options = {
            draftPackLotLines: undefined,
            quantity: 1,
            price_extra: orderline.price_extra,
            description: orderline.product.display_name,
        }
        let parent_orderline = await this.currentOrder.add_product_prosime_resolve(product, options)
        let extra_components = this.db.products_to_sync_by_orderline_id[orderline.id].extra_components
        for (let component of extra_components) {
            let extra = this.db.product_by_id[component.id]
            let options = {
                draftPackLotLines: undefined,
                quantity: component.qty,
                price_extra: 0.0,
                description: extra.display_name,
            }
            let child_orderline = await this.currentOrder.add_product_prosime_resolve(extra, options)
            this.db.add_child_orderline_by_orderline_id(parent_orderline.id, child_orderline.id)
        }
        this.db.add_product_to_sync_by_orderline_id(parent_orderline.id, orderline.product.id, options, extra_components)
    },
    markSingleAsScrap: async function (orderline_id) {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let orderline = orderlines.find(line => line.id === orderline_id)
            if (!orderline) return
            await rpc.query({
                model: 'stock.scrap',
                method: 'mark_as_scrap',
                args: [1, {
                    'id': orderline.product.id,
                    'qty': 1,
                    'origin': '',
                }],
            })
        } catch (e) {
            throw e
        }
    },
    markCurrentOrderAsScrap: async function () {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let ids = orderlines.map(line => {
                return {
                    id: line.product.id,
                    origin: ''
                }
            })
            await rpc.query({
                model: 'stock.scrap',
                method: 'mark_as_scrap_list',
                args: [1, ids],
            })
        } catch (e) {
            throw e
        }
    }
})

patch(Order.prototype, "prototype patch", {
    add_product_prosime_resolve: async function (product, options) {
        this.assert_editable()
        options = options || {}
        var line = Orderline.create({}, { pos: this.pos, order: this, product: product })
        this.fix_tax_included_price(line)
        this.set_orderline_options(line, options)
        this.add_orderline(line)
        this.select_orderline(this.get_last_orderline())
        return Promise.resolve(line)
    }
})
