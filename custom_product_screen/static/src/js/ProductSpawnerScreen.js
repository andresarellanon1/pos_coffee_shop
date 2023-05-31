/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useSubEnv, useState, } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'

class ProductSpawnerScreen extends PosComponent {
    setup(options) {
        super.setup();
        useSubEnv({ attribute_components: [] });
        useListener('spawn-product', this.spawnProduct)
    }
    spawnProduct(event) {
        let selected_attributes = {};
        let price_extra = 0.0;
        let product_product;
        this.env.attribute_components.forEach((attribute_component) => {
            let attribute = attribute_component.getValue();
            console.error(attribute);
            selected_attributes[attribute.id] = attribute.name;
            price_extra += attribute.price_extra;
        });
        console.warn(selected_attributes);
        let description = ""; 
        product_product = this.env.pos.db.get_product_by_attr(selected_attributes);
        this.trigger('product-spawned', {
            product_product,
            price_extra,
            description
        });
        this.trigger('close-temp-screen');
    }
}
ProductSpawnerScreen.template = 'custom_product_screen.ProductSpawnerScreen';
Registries.Component.add(ProductSpawnerScreen);

