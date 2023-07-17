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
        this.selectedOrder.production_id = {}
        this.db.products_extra_by_orderline_id = {}
        this.db.orderlines_to_sync_by_production_id = {}
        this._super(...arguments)
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
        this.production_id[line.id] = { orderline: line.id, production_id: production_id }
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
        this.production_by_orderline_id = {}
    }
})
