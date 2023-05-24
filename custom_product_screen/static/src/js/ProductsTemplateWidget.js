/** @odoo-module **/

import { ConnectionLostError, ConnectionAbortedError } from '@web/core/network/rpc_service'
import { useListener } from "@web/core/utils/hooks"
import PosComponent from 'point_of_sale.PosComponent'
import Registries from 'point_of_sale.Registries'
import { identifyError } from 'point_of_sale.utils'
import { useState } from '@odoo/owl';
class ProductsTemplateWidget extends PosComponent {
   setup() {
        super.setup();
        //useListener('load-products-from-server', this.loadProductTemplateFromDB);
        this.state = useState({ currentOffset: 0 });
        console.log("Product tempalte widget file constructor");
    }
    get productsTemplateToDisplay() {
        // TODO: add customizable menu feature, for now it's 0 default
        return this.env.pos.db.get_product_template_by_menu(0);
    }
    _updateproducttemplatelist() {
        this.render(true);
        this.trigger('switch-category', 0);
    }
    async loadProductTemplateFromDB() {
        try {
            const limit = 30;
            // TODO: Corroborar query columnas de busqueda
            let ProductTemplateIds = await this.rpc({
                model: 'product.template',
                method: 'search',
                args: [['&', ['available_in_pos', '=', true]]],
                context: this.env.session.user_context,
                kwargs: {
                    offset: this.state.currentOffset,
                    limit: limit,
                }
            });
            if (ProductTemplateIds.length) {
                await this.env.pos._addProductsTemplate(ProductTemplateIds, false);
            }
            this._updateProductList();
            return ProductIds;
        } catch (error) {
            const identifiedError = identifyError(error)
            if (identifiedError instanceof ConnectionLostError || identifiedError instanceof ConnectionAbortedError) {
                return this.showPopup('OfflineErrorPopup', {
                    title: this.env._t('Network Error'),
                    body: this.env._t("Product is not loaded. Tried loading the product from the server but there is a network error."),
                });
            } else {
                throw error;
            }
        }
    }
}
ProductsTemplateWidget.template = 'custom_product_screen.ProductsTemplateWidget';

Registries.Component.add(ProductsTemplateWidget);

