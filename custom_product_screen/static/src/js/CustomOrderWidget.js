/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useRef, onMounted, useExternalListener } from '@odoo/owl'
import NumberBuffer from 'point_of_sale.NumberBuffer'

class CustomOrderWidget extends PosComponent {
    setup() {
        super.setup()
        useExternalListener(window, 'product-spawned', this.productSpawned)
        this.scrollableRef = useRef('scrollable')
        NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        })
        onMounted(this.onMounted)
        onMounted(() => NumberBuffer.reset())
    }
    onMounted() {
        this.env.posbus.trigger('start-cash-control')
        if (!this.isEmployee)
            $(document).find('.pos-topheader').addClass('oe_hidden')
    }
    productSpawned(event) {
        NumberBuffer.reset()
        this.trigger('hide-loader')
    }
    get skipNextMO() {
        return this.state.skipNextMO
        m
    }
    get order() {
        return this.env.pos.get_order()
    }
    get isEmployee() {
        return this.env.pos.db.isEmployee
    }
    get _orderlinesArray() {
        let orderlines = this.order ? this.order.get_orderlines() : []
        let extras_orderlines_id = []
        for (let key in this.env.pos.db.products_extra_by_orderline) {
            extras_orderlines_id.push(this.env.pos.db.products_extra_by_orderline[key].orderline_id)
        }
        let result = orderlines.filter(or => !extras_orderlines_id.includes(or.id))
        return result
    }
}
CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget'
Registries.Component.add(CustomOrderWidget)

