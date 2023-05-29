/** @odoo-module  **/

import ProductScreen from 'point_of_sale.ProductScreen'
import Registries from 'point_of_sale.Registries'
import { useListener } from '@web/core/hooks'
import NumberBuffer from 'point_of_sale.NumberBuffer'

class ProductTemplateScreen extends ProductScreen {
    setup() {
        super.setup()
        useListener('product-spawned', this._productSpawned)
    }
    async _clickProduct(event) {
        if (!this.currentOrder) {
            this.env.pos.add_new_order();
        }
        const productTemplate = event.detail;
        console.log('productTemplate')
        console.log(productTemplate)
        // Filter attributes per product template attribute line
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined);
        // Launch SpawnerWidget
        // Consider change popup to widget and show in the same component (this)
        let { confirmed, payload } = await this.showPopup("ProductSpawnerPopup", {
            product: productTemplate,
            attributes: attributes,
        });
        if (!confirmed) return;
        let options = this._getProductOptions(payload.product_product, payload.price_extra, payload.description);
        if (!options) return;
        await this._addProduct(payload.product_product, options);
        NumberBuffer.reset();
    }
    async _getProductOptions(product, price_extra, description) {
        let draftPackLotLines, weight, description, packLotLinesToEdit;
        return { draftPackLotLines, quantity: weight, description, price_extra };
    }

}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen ';
Registries.Component.add(ProductTemplateScreen);
