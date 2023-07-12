/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useState, onMounted } from '@odoo/owl'
// NOTE: EXTRAS ARE PRODUCT.PRODUCT INSTANCE
class ExtraItem extends PosComponent {
    setup() {
        super.setup()
        this.env.extra_components.push(this)
        this.extra = this.props.extra
        this.limit = 5
        this.state = useState({
            count: 0,
            price_extra: 0.0,
        })
    }
    reset() {
        this.state.count = 0
        this.state.price_extra = 0.0
    }
    getValue() {
        return {
            extra: this.extra,
            count: this.state.count,
            price_extra: this.state.price_extra
        }
    }

    addExtra() {
        if (this.state.count < this.limit) {
            this.state.count += 1
            this.state.price_extra += this.extra.lst_price
        }
    }

    removeExtra() {
        if (this.state.count > 0) {
            this.state.count -= 1
            this.state.price_extra -= this.extra.lst_price
        }
    }

    get getCount() {
        return this.state.count
    }

    get getPriceExtra() {
        return this.state.price_extra
    }
}

ExtraItem.template = 'custom_product_screen.ExtraItem'
Registries.Component.add(ExtraItem)

