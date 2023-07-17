/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useRef, onMounted } from '@odoo/owl'

class CustomOrderWidget extends PosComponent {
    setup() {
        super.setup()
        this.scrollableRef = useRef('scrollable')
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
        for (let key in this.env.pos.db.products_extra_by_orderline_id) {
            extras_orderlines_id.push(this.env.pos.db.products_extra_by_orderline_id[key].orderline_id)
        }
        let result = orderlines.filter(or => !extras_orderlines_id.includes(or.id))
        return result
    }
}
CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget'
Registries.Component.add(CustomOrderWidget)

