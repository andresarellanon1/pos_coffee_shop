/** @odoo-module **/

import ProductScreen from 'point_of_sale.ProductScreen'
import Registries from 'point_of_sale.Registries'
import { useListener } from '@web/core/hooks'
import NumberBuffer from 'point_of_sale.NumberBuffer'

class ProductTemplateScreen extends ProductScreen {
    setup() {
        super.setup()
        useListener('product-spawned', this.productSpawned)
    }
    async _clickProduct(event) {
        const productTemplate = event.detail;
        // Filter attributes per product template attribute line
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined);
        await this.showTempScreen("ProductSpawnerScreen", {
            product: productTemplate,
            attributes: attributes
        });
    }
    productSpawned(payload){
        await this._addProduct(payload.product_product, {
            draftPackLotLines,
            quantity,
            descripcion,
            price_extra
        });
        this.trigger('close-temp-screen');
        NumberBuffer.reset();
    }
}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen ';
Registries.Component.add(ProductTemplateScreen);
