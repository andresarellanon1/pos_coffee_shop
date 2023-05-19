/** @odoo-module **/

import { ConnectionLostError, ConnectionAbortedError } from '@web/core/network/rpc_service'
import { useListener } from "@web/core/utils/hooks"
import { identifyError } from '@point_of_sale.utils'
import { PosComponent } from '@point_of_sale.PosComponent'
import { Registries } from '@point_of_sale.Registries'

const { useState } = owl;

class ProductsTemplateWidget extends PosComponent {
    /**
     * @param {Object} props
     */
    setup() {
        super.setup();
        useListener('load-products-from-server', this.loadProductTemplateFromDB);
        this.state = useState({ currentOffset: 0 });
    }
    get productsToDisplay() {
        // TODO: Patch DB class and add get_product_template_by_menu()
        return this.env.pos.db.get_product_by_category(this.selectedCategoryId);
    }
    get breadcrumbs() {
        // TODO: SWITCH SUBCATEGORY BREADCRUMB TO ATTRS TO SELECT VARIANT
        if (this.selectedCategoryId === this.env.pos.db.root_category_id) return [];
        return [
            ...this.env.pos.db
                .get_category_ancestors_ids(this.selectedCategoryId)
                .slice(1),
            this.selectedCategoryId,
        ].map(id => this.env.pos.db.get_category_by_id(id));
    }
    get hasNoVariants() {
        // TODO: fetch and .lengt === 0 variant total
        return this.env.pos.db.get_category_childs_ids(0).length === 0;
    }
    _updateProductTemplateList() {
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
                await this.env.pos._addProductsTemplate(ProductkemplateIds, false);
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

