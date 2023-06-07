/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useSubEnv, useState, } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'

class ProductSpawnerScreen extends PosComponent {
    setup(options) {
        super.setup();
        this.product_template_id = this.props.product.id;
        useSubEnv({ attribute_components: [], extras_components: [] });
        useListener('spawn-product', this.spawnProduct)
    }
    spawnProduct(event) {
        let selected_attributes = [];
        let draftPackLotLines, quantity;
        let price_extra = 0.0;
        this.env.attribute_components.forEach((attribute_component) => {
            let attribute = attribute_component.getValue();
            selected_attributes.push(attribute);
            price_extra += attribute.price_extra;
        });
        let product = this.env.pos.db.get_product_by_attr(selected_attributes, this.product_template_id);
        let options = {
            draftPackLotLines,
            quantity,
            price_extra: price_extra,
            description: "TODO: Generate description" // TODO: GENERATE DESCRIPTION
        };
        console.warn('product by attr');
        console.log(product);
        let parent_orderline = this.env.pos.get_order().add_product(product, options);
        console.warn('spawn product added product to order with line:');
        console.log(parent_orderline);
        this.env.extras_components.forEach((extra_component) => {
            let payload = extra_component.getValue();
            let options = {
                draftPackLotLines,
                quantity: payload.count,
                price_extra: payload.lst_price,
                description: payload.display_name,
            };
            let child_line = this.env.pos.get_order().add_product(payload.extra, options);
            this.env.pos.db.add_child_product(parent_orderline.id, product.id, payload.extra);
        });
        this.trigger('product-spawned');
        this.trigger('close-temp-screen');
    }
    get getDisplayExtras() {
        let categ_id = this.env.pos.db.get_categ_by_name('Extra');
        return this.env.pos.db.get_product_by_category(categ_id);
    }
}
ProductSpawnerScreen.template = 'custom_product_screen.ProductSpawnerScreen';
Registries.Component.add(ProductSpawnerScreen);

