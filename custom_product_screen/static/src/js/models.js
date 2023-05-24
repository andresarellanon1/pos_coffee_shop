/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Product } from 'point_of_sale.models'

patch(PosGlobalState.prototype, "prototype patch", {
    async _processData(loadedData) {
        this._loadProductTemplate(loadedData['product.template']);
        this._super(loadedData);
        console.log("patching pos collection");
    },
    _loadProductTemplate(products) {
        const productMap = {};
        const productTemplateMap = {};
        const modelProducts = products.map(product => {
            product.pos = this;
            product.applicablePricelistItems = {};
            productMap[product.id] = product;
            productTemplateMap[product.product_tmpl_id[0]] = (productTemplateMap[product.product_tmpl_id[0]] || []).concat(product);
            return Product.create(product);
        });
        console.log("modelProducts:");
        console.log(modelProducts);
        console.log(this.db);
        this.db.add_products_templates(modelProducts)
    }
});
