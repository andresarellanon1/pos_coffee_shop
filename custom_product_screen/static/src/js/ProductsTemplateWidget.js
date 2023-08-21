/** @odoo-module **/

import { ConnectionLostError, ConnectionAbortedError } from '@web/core/network/rpc_service'
import PosComponent from 'point_of_sale.PosComponent'
import Registries from 'point_of_sale.Registries'
import { identifyError } from 'point_of_sale.utils'
import { useState } from '@odoo/owl'

class ProductTemplateWidget extends PosComponent {
    setup() {
        super.setup()
        this.state = useState({ currentOffset: 0 })
    }
    get productsTemplateToDisplay() {
        // TODO: add customizable menu feature, for now it's 0 default
        return this.env.pos.db.get_product_template_by_menu(0)
    }
    _updateproducttemplatelist() {
        this.render(true)
        this.trigger('switch-category', 0)
    }
}
ProductTemplateWidget.template = 'custom_product_screen.ProductTemplateWidget'
Registries.Component.add(ProductTemplateWidget)

