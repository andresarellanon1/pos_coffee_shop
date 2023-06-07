/** @odoo-module **/

import { patch } from 'web.utils'
import Orderline from 'point_of_sale.Orderline'

patch(Orderline.prototype, "getter/setter patch", {
    get childOrderlines() {
        let orderlines = this.env.pos.get_order().get_orderlines();
        let result = this.env.pos.db.get_child_orderlines(this.props.line.id, orderlines);
        console.warn('child orderlines:');
        console.log(result);
    }
});
