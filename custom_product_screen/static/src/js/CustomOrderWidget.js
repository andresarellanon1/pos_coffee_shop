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
    get orderlinesArray() {
        let orderlines = this.order ? this.order.get_orderlines() : [];
        console.warn('orderlines');
        console.log(orderlines);
        let result = orderlines.filter((orderline) => {
            console.log(orderline);
            let childs = this.env.pos.db.get_child_orderlines(orderline.id, orderlines)
            if (childs.length && childs.length > 0) return true;
            return false;
        });
        console.warn('filtered orderlines');
        console.log(result);
        return result;
    }
}
CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget';
Registries.Component.add(CustomOrderWidget);

