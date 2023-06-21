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
    async spawnProduct(event) {
        let selected_attributes = [];
        let component_products = [];
        let draftPackLotLines, quantity;
        let price_extra = 0.0;
        // Collect attrbiutes from UI 
        this.env.attribute_components.forEach((attribute_component) => {
            let attribute = attribute_component.getValue();
            selected_attributes.push(attribute);
            price_extra += attribute.price_extra;
        });
        // Locate product.product by attributes
        let product = this.env.pos.db.get_product_by_attr(selected_attributes, this.product_template_id);
        // define options, quantity should always be 1
        let options = {
            draftPackLotLines,
            quantity:1,
            price_extra: price_extra,
            description: "" // TODO: GENERATE DESCRIPTION
        };
        // Collect extra components from UI and iterate 
        for (let extra_component of this.env.extras_components) {
            let payload = extra_component.getValue();
            // ignore if components is 0 on UI
            if(payload.count <= 0 || payload.count > 5) continue
            component_products.push(payload);
            // add extra component price here to the main product
            price_extra += payload.lst_price;
        };
        // add orderline to order
        let parent_orderline = await this._addProduct(product, options);
        // TODO: if this session is sender prepare product to sync
        this.env.pos.db.product_to_sync(parent_orderline.id, product.id, options);
        // iterate again over components now with the parent orderline created
        // NOTE: I can not think of another way to accumulate the price_extra on the product before creating the orderline
        // and at the same iteration add the child orderline because the child orderline requieres the parent orderline which is to wait until the price_extra of all componentes accumulates to be created
        for (let product_component of component_products) {
            // orderline should not increase the order final price on it's own
            let options = {
                draftPackLotLines,
                quantity: product_component.count,
                price_extra: 0.0,
                description: product_component.display_name,
            };
            let child_orderline = await this._addProduct(product_component.extra, options);
            this.env.pos.db.add_child_orderline(parent_orderline.id, child_orderline.id, product.id, product_component.extra);
            // TODO: if this session is sender prepare product to sync
            this.env.pos.db.component_to_sync(parent_orderline.id, product.id, product_component.count);
        }
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

