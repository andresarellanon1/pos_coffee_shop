/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import AbstractAwaitablePopup from 'point_of_sale.AbstractAwaitablePopup'
import { useSubEnv, useState } from '@odoo/owl'


class ProductSpawnerPopup extends AbstractAwaitablePopup {
    setup() {
        super.setup();
        useSubEnv({ attribute_components });
    }
    getPayload() {
        let selected_attributes = {};
        let price_extra = 0.0;
        let product_product;

        this.env.attribute_components.forEach((attribute_component) => {
            let { value, extra } = attribute_component.getValue();
            selected_attributes[value.id] = value;
            price_extra += extra;
        });
        
        description =selected_attributes.join(', ');
        
        let products = this.env.pos.db.get_product_template_by_menu(0);
        // TODO: use selected attributes to search and retrieve product.product object (variant created with instantlly option)
        product_product = products.find((product)=>{
            product.k

        })

        return {
            product_product,
            price_extra,
            description
        };
    }
}
ProductSpawnerPopup.template = 'custom_product_screen.ProductSpawnerPopup';
Registries.Component.add(ProductSpawnerPopup);

