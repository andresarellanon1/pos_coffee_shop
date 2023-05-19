/** @odoo-module **/

import { PosComponent } from 'point_of_sale.PosComponent';
import { Registry } from "@web/core/registry";

const Registries = new Registry();
const { useState } = owl.hooks;

class ProductTemplateItem extends PosComponent {

    get imageUrl() {
        const product = this.props.product;
        return `/web/image?model=product.template&field=image_128&id=${product.id}&unique=${product.__last_update}`;
    }
}

ProductTemplateItem.template = 'custom_product_screen.ProductTemplateItem';

Registries.Component.add(ProductTemplateItem)
