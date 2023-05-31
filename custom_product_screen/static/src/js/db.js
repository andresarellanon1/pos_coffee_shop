/** @odoo-module **/

import { patch } from 'web.utils'
import PosDB from 'point_of_sale.DB'

patch(PosDB.prototype, "prototype patch", {
    init(options) {
        this.products_template_by_id = {}
        this._super(options)
    },

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
        if (this.products_template_by_id) {
            for (let key in this.products_template_by_id) {
                let product = this.products_template_by_id[key];
                if (!(product.active && product.available_in_pos)) continue;
                list.push(product);
            }
        }
        return list;
    },
    get_product_by_attr: function(selected_attributes){
        let result
        Object.keys(selected_attributes).foreach((value) => {
            if(this.product_by_id.display_name.contains(value)){
            }
        });
        return [];
    }
});
