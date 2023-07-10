/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Order, Orderline } from 'point_of_sale.models'

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
    }
})

patch(Order.prototype, "prototype patch", {
    add_product_but_well_done: async function (product, options) {
        this.assert_editable()
        options = options || {}
        var line = Orderline.create({}, { pos: this.pos, order: this, product: product })
        this.fix_tax_included_price(line)
        this.set_orderline_options(line, options)
        // NOTE: do not merge the lines...
        this.add_orderline(line)
        this.select_orderline(this.get_last_orderline())
        return Promise.resolve(line)
    },
    get_screen_data: function () {
        const screen = this.screen_data['value']
        // If no screen data is saved
        //   no payment line -> product screen
        //   with payment line -> payment screen
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

