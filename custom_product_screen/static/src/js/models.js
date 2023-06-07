/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Product, Order } from 'point_of_sale.models'

patch(PosGlobalState.prototype, "prototype patch", {
    _processData: async function(loadedData) {
        this._loadProductTemplate(loadedData['product.template']);
        this._super(loadedData);
    },
    _loadProductTemplate: function(products) {
        this.db.add_products_templates(products)
    }
});

patch(Order.prototype, "prototype patch", {
    add_product: function(product,options){
        
    }
});
