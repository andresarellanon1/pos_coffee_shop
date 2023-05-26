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
        // Launch SpawnerWidget
        // Consider change popup to widget and show in the same component (this)
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined);

        let { confirmed, payload } = await this.showPopup("ProductSpawnerPopup", {
            product: productTemplate,
            attributes: attributes,
        });
        let options = this._getProductOptions(payload.product_product, payload.price_extra, payload.description);
        if (!options) return;
        await this._addProduct(payload.product_product, options);
        NumberBuffer.reset();
    }
    async _getProductOptions(product, price_extra, description) {
        let draftPackLotLines, weight, description, packLotLinesToEdit;

        // Gather lot information if required.
        if (['serial', 'lot'].includes(product.tracking) && (this.env.pos.picking_type.use_create_lots || this.env.pos.picking_type.use_existing_lots)) {
            const isAllowOnlyOneLot = product.isAllowOnlyOneLot();
            if (isAllowOnlyOneLot) {
                packLotLinesToEdit = [];
            } else {
                const orderline = this.currentOrder
                    .get_orderlines()
                    .filter(line => !line.get_discount())
                    .find(line => line.product.id === product.id);
                if (orderline) {
                    packLotLinesToEdit = orderline.getPackLotLinesToEdit();
                } else {
                    packLotLinesToEdit = [];
                }
            }
            const { confirmed, payload } = await this.showPopup('EditListPopup', {
                title: this.env._t('Lot/Serial Number(s) Required'),
                isSingleItem: isAllowOnlyOneLot,
                array: packLotLinesToEdit,
            });
            if (confirmed) {
                // Segregate the old and new packlot lines
                const modifiedPackLotLines = Object.fromEntries(
                    payload.newArray.filter(item => item.id).map(item => [item.id, item.text])
                );
                const newPackLotLines = payload.newArray
                    .filter(item => !item.id)
                    .map(item => ({ lot_name: item.text }));

                draftPackLotLines = { modifiedPackLotLines, newPackLotLines };
            } else {
                // We don't proceed on adding product.
                return;
            }
        }

        return { draftPackLotLines, quantity: weight, description, price_extra };
    }

}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen ';
Registries.Component.add(ProductTemplateScreen);
