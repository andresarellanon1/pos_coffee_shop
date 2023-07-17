/** @odoo-module **/

import { patch } from 'web.utils'
import Orderline from 'point_of_sale.Orderline'

patch(Orderline.prototype, "getter/setter patch", {
    get childOrderlines() {
        let orderlines = this.env.pos.get_order().get_orderlines()
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline_id
        let orderline_id = this.props.line.id
        let child_orderlines = []
        for (let key in product_extra_by_orderline) {
            if (product_extra_by_orderline[key].parent_orderline_id === orderline_id)
                child_orderlines.push(orderlines.find(or => or.id === product_extra_by_orderline[key].orderline_id))
        }
        return child_orderlines
    },
    get imageUrl() {
        let product = this.props.line.product
        return `/web/image?model=product.template&id=${product.product_tmpl_id}&field=image_128`
    }
})
