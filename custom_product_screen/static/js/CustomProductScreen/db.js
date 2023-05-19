/** @odoo-module **/

import { patch } from '@web.utils'
import { PosDB } from '@point_of_sale.'

patch(PosDB.prototype, "prototype patch", {
    add_products_templates: function(products) {
        var stored_categories = this.product_by_category_id;

        if (!(products instanceof Array)) {
            products = [products];
        }
        for (var i = 0, len = products.length; i < len; i++) {
            var product = products[i];
            if (product.id in this.products_template_by_id) continue;
            this.products_template_by_id[product.id] = product;
        }
    },
});
