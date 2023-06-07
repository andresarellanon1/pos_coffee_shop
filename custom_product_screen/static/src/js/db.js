/** @odoo-module **/

import { patch } from 'web.utils'
import PosDB from 'point_of_sale.DB'

patch(PosDB.prototype, "prototype patch", {
    init(options) {
        this.products_template_by_id = {}
        this.products_extra_by_product_id = [] 
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
        let categ_id = this.get_categ_by_name('Bebida'); // TODO: move string literal to CONST string
        if (this.products_template_by_id) {
            for (let key in this.products_template_by_id) {
                let product = this.products_template_by_id[key];
                //console.warn('for keyproducts template by id');
                //console.log(product);
                if (!(product.active && product.available_in_pos && product.pos_categ_id[0] === categ_id)) continue;
                list.push(product);
            }
        }
        return list;
    },
    get_product_by_attr: function(selected_attributes, product_template_id){
        let product;
        let words = selected_attributes.map((value) => {return value.name});
        for (let key in this.product_by_id) {
            if(this.product_by_id[key].product_tmpl_id !== product_template_id) continue;
            if(words.every((el)=>{ return this.product_by_id[key].display_name.match(new RegExp(el,"i")) })){
                product = this.product_by_id[key];
                break;
            }
        }
        return product; 
    },
    get_categ_by_name: function(name){
        let categ_id;
        for(let key in this.category_by_id){
            //console.warn('for key in category');
            //console.log(this.category_by_id[key]);
            if(this.category_by_id[key].name !== name) continue;
            categ_id = this.category_by_id[key].id;
        }
        return categ_id;
    },
    add_child_product: function (orderline_id, product, childProduct) {
        this.products_extra_by_product_id.push({
            orderline_id: orderline_id,
            parent_product_id: product.id,
            child_product: childProduct,
        });
    },
    get_child_orderlines: function(orderline_id, orderlines){
        let child_orderlines = [];
        let parent_orderline = orderlines.find(or => or.id === orderline_id);
        for(let j = 0; j < this.products_extra_by_product_id.length; j++){
            if(this.products_extra_by_product_id[j].parent_product_id !== parent_orderline.product.id) continue;
            if(this.products_extra_by_product_id[j].orderline_id !== orderline_id) continue;
            child_orderlines.push(orderlines.find(or => or.id === orderline_id);
        }
        return child_orderlines;
    },
});
