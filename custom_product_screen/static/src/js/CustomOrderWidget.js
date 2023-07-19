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
        let products_to_sync_by_orderline_id = Object.keys(this.env.pos.db.products_to_sync_by_orderline_id)
        console.warn(products_to_sync_by_orderline_id)
        console.warn(orderlines)
        let result = orderlines.filter(or => products_to_sync_by_orderline_id.includes(or.id))
        console.warn(result)
        return result
    }
}
CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget'
Registries.Component.add(CustomOrderWidget)

