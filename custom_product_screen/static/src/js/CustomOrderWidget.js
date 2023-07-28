/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useRef } from '@odoo/owl'

class CustomOrderWidget extends PosComponent {
    setup() {
        super.setup()
        this.scrollableRef = useRef('scrollable')
    }
    get skipNextMO() {
        return this.state.skipNextMO
    }
    get currentOrder() {
        return this.env.pos.get_order()
    }
    get isEmployee() {
        return this.env.pos.db.isEmployee
    }
    get _orderlinesArray() {
        let orderlines = this.currentOrder ? this.currentOrder.get_orderlines() : []
        let products_to_sync_by_orderline_id = Object.keys(this.env.pos.db.products_to_sync_by_orderline_id)
        let result = orderlines.filter(line => products_to_sync_by_orderline_id.includes(`${line.id}`))
        return result
    }
    getTotal() {
        return this.env.pos.format_currency(this.currentOrder.get_total_with_tax());
    }
    getTax() {
        const total = this.currentOrder.get_total_with_tax();
        const totalWithoutTax = this.currentOrder.get_total_without_tax();
        const taxAmount = total - totalWithoutTax;
        return {
            hasTax: !float_is_zero(taxAmount, this.env.pos.currency.decimal_places),
            displayAmount: this.env.pos.format_currency(taxAmount),
        };
    }
}
CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget'
Registries.Component.add(CustomOrderWidget)

