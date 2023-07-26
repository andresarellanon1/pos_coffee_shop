/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'

class CustomOrderline extends PosComponent {
    get childOrderlines() {
        let orderlines = this.env.pos.get_order().get_orderlines()
        let child_orderline_by_orderline_id = this.env.pos.db.child_orderline_by_orderline_id
        let orderline_id = this.props.line.id
        let child_orderlines = []
        for (let key in child_orderline_by_orderline_id) {
            if (child_orderline_by_orderline_id[key].parent_orderline_id === orderline_id)
                child_orderlines.push(orderlines.find(line => line.id === child_orderline_by_orderline_id[key].orderline_id))
        }
        return child_orderlines
    }
    get imageUrl() {
        let product = this.props.line.product
        return `/web/image?model=product.template&id=${product.product_tmpl_id}&field=image_128`
    }
}

CustomOrderline.template = 'custom_product_screen.CustomOrderline'
Registries.Component.add(CustomOrderline)

