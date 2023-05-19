/** @odoo-module **/

import { patch } from '@web.utils'
import { PosDB } from '@point_of_sale/js'

patch(PosDB.prototype, "constructor", {
    setup() {
        this.setup()
        this.products_template_by_id = {}
    },
});
patch(PosDB.prototype, "prototype patch", {
  add_products_templates: function (products) {
        if (!(products instanceof Array)) {
            products = [products];
        }
        for (var i = 0, len = products.length; i < len; i++) {
            var product = products[i];
            if (product.id in this.products_template_by_id) continue;
            this.products_template_by_id[product.id] = product;
        }
    },
    get_product_template_by_menu: function (menu_id) {
        var list = [];
        if (products_template_by_id) {
            // TODO: Revisar this.limit y sus implicaciones para el caso de uso del coffee shop
            for (var i = 0, len = Math.min(product_ids.length, this.limit); i < len; i++) {
                const product = this.products_template_by_id[i];
                if (!(product.active && product.available_in_pos)) continue;
                list.push(product);
            }
        }
        return list;
    },
});