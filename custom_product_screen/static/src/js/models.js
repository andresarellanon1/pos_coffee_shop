/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Order, Orderline } from 'point_of_sale.models'
import rpc from 'web.rpc'

/**
 * Patch for PosGlobalState class to provide additional functionality.
 */
patch(PosGlobalState.prototype, "getter/setter patch", {
    /**
     * Get the current order.
     * @returns {Order} The current order.
     */
    get currentOrder() {
        return this.get_order()
    }
})
/**
 * Patch for PosGlobalState class to add custom methods.
 */
patch(PosGlobalState.prototype, "prototype patch", {
    /**
     * Process loaded data and perform custom loading.
     * @param {Object} loadedData - The loaded data.
     */
    _processData: async function(loadedData) {
        this._loadProductTemplate(loadedData['product.template'])
        this._loadMrpBom(loadedData['mrp.bom'])
        this._loadBomLines(loadedData['mrp.bom.line'])
        this._super(loadedData)
    },
    /**
     * Load product templates.
     * @param {Object[]} products - The product templates to load.
     */
    _loadProductTemplate: function(products) {
        this.db._isEmployee()
        this.db.add_products_templates(products)
    },
    /**
     * Load manufacturing bills of materials (BOMs).
     * @param {Object[]} boms - The BOMs to load.
     */
    _loadMrpBom: function(boms) {
        this.db.add_boms(boms)
    },
    /**
     * Load BOM lines.
     * @param {Object[]} lines - The BOM lines to load.
     */
    _loadBomLines: function(lines) {
        this.db.add_bom_lines(lines)
    },
    /**
     * Add a new order and reset related data.
     */
    add_new_order: function() {
        this.db.child_orderline_by_orderline_id = {}
        this.db.products_to_sync_by_orderline_id = {}
        this.db.orderlines_to_sync_by_production_id = {}
        this.db.orderlineSkipMO = []
        this._super(...arguments)
    },
    /**
     * Create manufacturing productions for the current order.
     * @throws {Error} If an error occurs during production creation.
     */
    createCurrentOrderMrpProduction: async function() {
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
                    args: [argBody],
                })
                this.db.add_orderline_to_sync_by_production_id(id, orderline.id)
            }
        } catch (e) {
            throw e
        }
    },

    /**
     * Confirm manufacturing productions for the current order.
     * @throws {Error} If an error occurs during production confirmation.
     */
    confirmCurrentOrderMrpProduction: async function() {
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
                    args: [{
                        'id': orderline.product.id,
                        'production_id': orderlines_to_sync_by_production_id[key].production_id,
                    }],
                })
            }
        } catch (e) {
            throw e
        }
    },
    /**
     * Clear manufacturing productions for the current order.
     * @throws {Error} If an error occurs during production clearing.
     */
    clearCurrentOrderMrpProduction: async function() {
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

    /**
     * Clear a single manufacturing production for an orderline.
     * @param {number} orderline_id - The ID of the orderline.
     * @throws {Error} If an error occurs during production clearing.
     */
    clearSingleMrpProduction: async function(orderline_id) {
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
    /**
     * Send the order to the main Point of Sale.
     * NOTE: this method expects the orderlines to have a production id created and stored in memory 
     * @param {number} retry - Number of retry attempts.
     * @throws {Error} If an error occurs during order sending.
     */
    sendOrderToMainPoS: async function(retry) {
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
            let response = await fetch("https://hercor-pruebas.quadrosoluciones.com/order", {
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
    /**
     * Fix the queue for the current order in the main Point of Sale.
     * NOTE: only requires to fix on click pay for the orders created in the main PoS because the order uids haven't been pushed in the queue yet 
     * NOTE: the client session method "sendOrderToMainPoS" does this as a side effect on its backend handler
     * @param {number} retry - Number of retry attempts.
     * @throws {Error} If an error occurs during queue fixing.
     */
    fixQueueForCurrentOrder: async function(retry) {
        try {
            await this.fetchVersion(3)
            let order = this.currentOrder
            let uid = order.name
            let orderlines_ids = order.get_orderlines().map(line => line.id)
            let orderlinesRemote_ids = this.db.orderlineSkipMO.map(line => line.id)
            let isFix = orderlines_ids.every(line_id => orderlinesRemote_ids.includes(line_id))
            if (isFix) return
            let response = await fetch("https://hercor-pruebas.quadrosoluciones.com/setNextProduction", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Authorization": this.db.auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uid: `POS-${uid}` })
            })
            console.warn('fixed queue', response)
            if (response.status === 200)
                return
            if (retry > 0)
                await this.fixQueueForCurrentOrder(retry - 1)
        } catch (e) {
            throw e
        }
    },
    /**
     * Fetch orders from the client's Point of Sale.
     * @param {number} retry - Number of retry attempts.
     * @throws {Error} If an error occurs during order fetching.
     */
    fetchOrderFromClientPoS: async function(retry) {
        try {
            await this.fetchVersion(3)
            let response = await fetch("https://hercor-pruebas.quadrosoluciones.com/order", {
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
    /**
     * Load data from the client's order to the current order.
     * @param {Object} orderPayload - The payload containing order data.
     * @throws {Error} If an error occurs during data loading.
     */
    loadDataToCurrentOrder: async function(orderPayload) {
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
    /**
     * Duplicate an orderline and its components.
     * @param {Orderline} orderline - The orderline to duplicate.
     */
    dupeSpawn: async function(orderline) {
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
    /**
     * Mark a single orderline as scrap.
     * @param {number} orderline_id - The ID of the orderline.
     * @throws {Error} If an error occurs during marking as scrap.
     */
    markSingleAsScrap: async function(orderline_id) {
        try {
            let order = this.currentOrder
            let orderlines = order.get_orderlines()
            let orderline = orderlines.find(line => line.id === orderline_id)
            if (!orderline) return
            await rpc.query({
                model: 'stock.scrap',
                method: 'mark_as_scrap',
                args: [{
                    'id': orderline.product.id,
                    'qty': 1,
                    'origin': '',
                }],
            })
        } catch (e) {
            throw e
        }
    },
    /**
     * Mark the current order as scrap.
     * @throws {Error} If an error occurs during marking the order as scrap.
     */
    markCurrentOrderAsScrap: async function() {
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
                args: [ids],
            })
        } catch (e) {
            throw e
        }
    }
})

/**
 * Patch for Order class to add custom methods.
 */
patch(Order.prototype, "prototype patch", {
    /**
     * Add a product to the order and return the orderline.
     * @param {Object} product - The product to add.
     * @param {Object} options - Additional options for the orderline.
     * @returns {Promise<Orderline>} The added orderline.
     */
    add_product_prosime_resolve: async function(product, options) {
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
