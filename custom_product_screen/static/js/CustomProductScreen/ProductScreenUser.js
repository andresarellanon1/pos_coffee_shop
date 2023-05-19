/** @odoo-module **/

import { patch } from '@web.utils'
import { ProductScreen } from '@point_of_sale/js/Screens/ProductScreen'

patch(ProductScreen.prototype, "prototype patch", {

    async _clickProduct(event) {
        if (!this.currentOrder) {
            this.env.pos.add_new_order();
        }
        const productTemplate = event.detail;
        const { confirmed, payload } = await this.showPopup('ProductVariantSelector', { productTemplate });
        // NOTA: EL FUNCIONAMIENTO DESEADO IMPLICA QUE ESTA OPCION SIEMPRE REGRESE LOS OPTIONS CORRECTOS Y QUE NO GENERE EL POPUP
        // TODO: OVERWRITE _getAddProductOptions to make sure it always return the options without opening the options manager
        const options = await this._getAddProductOptions(payload);
        // Do not add product if options is undefined.
        if (!options) return;
        // Add the product after having the extra information.
        await this._addProduct(product, options);
        NumberBuffer.reset();
    },

    isClient() {
        return true;
    }
});
