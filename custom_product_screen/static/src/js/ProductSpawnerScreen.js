/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useSubEnv, useState, } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'

class ProductSpawnerScreen extends PosComponent {
    setup(options) {
        super.setup();
        this.product_template_id = this.props.product.id;
        useSubEnv({ attribute_components: [], extra_components: [] });
        useListener('spawn-product', this.spawnProduct)
    }
    async spawnProduct(event) {
        let selected_attributes = [];
        let component_products = [];
        let extra_components = [];
        let draftPackLotLines, quantity;
        let price_extra = 0.0;
        for (let attribute_component of this.env.attribute_components) {
            let attribute = attribute_component.getValue();
            selected_attributes.push(attribute);
            price_extra = price_extra + attribute.price_extra;
        };
        for (let extra_component of this.env.extra_components) {
            let payload = extra_component.getValue();
            // ignore if component is 0 on UI
            if (payload.count <= 0 || payload.count > 5) continue
            component_products.push(payload);
            console.warn('extras payload')
            console.log(payload)
            // accumulate extra component price on the main product
            price_extra = price_extra + payload.price_extra;
        };
        let product = this.env.pos.db.get_product_by_attr(selected_attributes, this.product_template_id);
        // enforce 1 quantity created at a time
        let options = {
            draftPackLotLines,
            quantity: 1,
            price_extra: price_extra,
            description: ""
        };
        console.warn('spawning product:')
        console.log(product)
        console.warn('spawning options:')
        console.log(options)
        let parent_orderline = await this._addProduct(product, options);
        // NOTE: I can not think of another way to accumulate the price_extra on the product before creating the orderline
        // and at the same iteration add the child orderline because the child orderline requieres the parent orderline which is to wait until the price_extra of all componentes accumulates to be created
        for (let component of component_products) {
            // extra component orderline should not increase the order final price on it's own
            let options = {
                draftPackLotLines,
                quantity: component.count,
                price_extra: 0.0,
                description: component.display_name,
            };
            let child_orderline = await this._addProduct(component.extra, options);
            extra_components.push({ product_id: component.extra.id, qty: component.count });
            this.env.pos.db.add_child_orderline(parent_orderline.id, child_orderline.id, product.id, component.extra);
        }
        this.env.pos.db.add_product_to_sync(product.id, options, extra_components);
        this.trigger('product-spawned');
        this.trigger('close-temp-screen');
    }

    async _addProduct(product, options) {
        return await this.currentOrder.add_product_but_well_done(product, options);
    }

    get currentOrder() {
        return this.env.pos.get_order();
    }

    get getDisplayExtras() {
        let categ_id = this.env.pos.db.get_categ_by_name('Extra');
        let result = this.env.pos.db.get_product_by_category(categ_id);
        //TODO: use this.product_template_id to fetch the bom and filter only extras aplicable to prod tmpl bom
        return result;
    }
}
ProductSpawnerScreen.template = 'custom_product_screen.ProductSpawnerScreen';
Registries.Component.add(ProductSpawnerScreen);

