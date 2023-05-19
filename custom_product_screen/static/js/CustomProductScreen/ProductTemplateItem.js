/** @odoo-module **/

import { PosComponent } from '@point_of_sale/js/Screens/ProductScreen'
import { Registry } from "@web/core/registry";

const Registries = new Registry();
const { useState } = owl.hooks;

class ProductTemplateItem extends PosComponent {

   get imageUrl() {
        const product = this.props.product;
        return `/web/image?model=product.template&field=image_128&id=${product.id}&unique=${product.__last_update}`;
    }
    get pricelist() {
        const current_order = this.env.pos.get_order();
        if (current_order) {
            return current_order.pricelist;
        }
        return this.env.pos.default_pricelist;
    }
    get price() {
        const formattedUnitPrice = this.env.pos.format_currency(
            this.props.product.get_display_price(this.pricelist, 1),
            'Product Price'
        );
        if (this.props.product.to_weight) {
            return `${formattedUnitPrice}/${this.env.pos.units_by_id[this.props.product.uom_id[0]].name
                }`;
        } else {
            return formattedUnitPrice;
        }
    }
}

ProductTemplateItem.template = 'custom_product_screen.ProductTemplateItem';;

Registries.Component.add(ProductTemplateItem)
