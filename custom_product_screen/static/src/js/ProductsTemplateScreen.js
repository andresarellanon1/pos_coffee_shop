/** @odoo-module **/

import { PosComponent } from '@point_of_sale/js';
import { Registry } from "@web/core/registry";

const Registries = new Registry();
const { useState } = owl.hooks;

class ProductsTemplateScreen extends PosComponent {
    setup() {
        super.setup();

    }
    async _clickProduct(event) {
        if (!this.currentOrder) {
            this.env.pos.add_new_order();
        }
        const productTemplate = event.detail;

        Console.log("customclickproduct");
        const options = await this._getAddProductOptions(payload);
        // Do not add product if options is undefined.
        if (!options) return;
        // Add the product after having the extra information.
        await this._addProduct(product, options);
        NumberBuffer.reset();
    }
    // NOTA: EL FUNCIONAMIENTO DESEADO IMPLICA QUE ESTA OPCION SIEMPRE REGRESE LOS OPTIONS CORRECTOS Y QUE NO GENERE EL POPUP
    // TODO: OVERWRITE _getAddProductOptions to make sure it always return the options from the custom options manager
    async _getAddProductOptions(product) {
        if (_.some(product.attribute_line_ids, (id) => id in this.env.pos.attributes_by_ptal_id)) {
            let attributes = _.map(product.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
                .filter((attr) => attr !== undefined);
            let { confirmed, payload } = await this.showPopup('ProductVariantSelector', {
                product: product,
                attributes: attributes,
            });

            if (confirmed) {
                description = payload.selected_attributes.join(', ');
                price_extra += payload.price_extra;
            } else {
                return;
            }
        }
        return { draftPackLotLines, quantity: weight, description, price_extra };
    }
    isClient() {
        return true;
    }

}

//ProductsTemplateScreen.template = 'custom_product_screen.ProductsTemplateScreen ';

//Registries.Component.add(ProductsTemplateScreen):
