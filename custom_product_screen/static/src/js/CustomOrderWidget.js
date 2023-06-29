/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useRef } from '@odoo/owl'

class CustomOrderWidget extends PosComponent {
    setup() {
        super.setup();
        this.scrollableRef = useRef('scrollable');
    }
    get order() {
        return this.env.pos.get_order();
    }
    get isEmployee(){
        return this.env.pos.db.isEmployee;
    }
    get _orderlinesArray() {
        let orderlines = this.order ? this.order.get_orderlines() : [];
        let parent_orderlines_id = [];
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
        for (let key in product_extra_by_orderline) {
            console.log(product_extra_by_orderline[key]);
            parent_orderlines_id.push(product_extra_by_orderline[key].parent_orderline_id);
        }
        let result = orderlines.filter(or => parent_orderlines_id.includes(or.id));
        console.warn('parent orderlines array');
        console.log(result);
        return result;
    }
}
CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget';
Registries.Component.add(CustomOrderWidget);

