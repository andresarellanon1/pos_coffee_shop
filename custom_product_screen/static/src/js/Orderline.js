/** @odoo-module **/

import { patch } from 'web.utils'
import Orderline from 'point_of_sale.Orderline'

patch(Orderline.prototype, "getter/setter patch", {
    get childOrderlines() {
        let orderlines = this.env.pos.get_order().get_orderlines();
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
        let orderline_id = this.props.line.id;
        let child_orderlines = [];
        for (let key in product_extra_by_orderline) { // iterate by key
            if (product_extra_by_orderline[key].parent_orderline_id === orderline_id) // evaluate if current orderline is parent for the iteration
                child_orderlines.push(orderlines.find(or => or.id === product_extra_by_orderline[key].orderline_id)); // if current orderline is parent we push the object[key] by searching with the id on the orderline array
        }
        return child_orderlines;
    }
});
