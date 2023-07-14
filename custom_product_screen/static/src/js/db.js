/** @odoo-module **/

import { patch } from 'web.utils'
import PosDB from 'point_of_sale.DB'
import rpc from 'web.rpc'

patch(PosDB.prototype, "prototype patch", {
    init(options) {
        this.products_template_by_id = {}
        this.boms_by_template_id = {}
        this.bom_lines_by_bom_id = {}
        this.products_extra_by_orderline = {}
        this.orderlines_to_sync = []
        this.components_to_sync = []
        this.isEmployee = false
        this._super(options)
    },
    add_products_templates: function(products) {
        if (!(products instanceof Array)) {
            products = [products]
        }
        for (let product of products) {
            if (product === null) continue
            if (product.id in this.products_template_by_id) continue
            this.products_template_by_id[product.id] = product
        }
    },
    add_boms: function(boms) {
        for (let bom of boms) {
            this.boms_by_template_id[bom.product_tmpl_id[0]] = bom
            this.bom_lines_by_bom_id[bom.id] = []
        }
    },
    add_bom_lines: function(lines) {
        try {
            for (let line of lines)
                this.bom_lines_by_bom_id[line.bom_id[0]].push(line)
        } catch (e) {
            console.error('Most likely caused by a poor mrp.bom configuration')
            console.error(e)
        }
    },
    // TODO: optimize to O(1)
    get_product_template_by_menu: function(menu_id) {
        var list = []
        let categ_id = this.get_categ_by_name('Bebida') // TODO: move string literal to CONST string
        if (this.products_template_by_id) {
            for (let key in this.products_template_by_id) {
                let product = this.products_template_by_id[key]
                if (!(product.active && product.available_in_pos && product.pos_categ_id[0] === categ_id)) continue
                list.push(product)
            }
        }
        return list
    },
    // TODO: optimize to O(1)
    get_product_by_attr: function(selected_attributes, product_template_id) {
        let product
        let words = selected_attributes.map((value) => { return value.name })
        for (let key in this.product_by_id) {
            if (this.product_by_id[key].product_tmpl_id !== product_template_id) continue
            if (words.every(el => this.product_by_id[key].display_name.match(new RegExp(el, "i")))) {
                product = this.product_by_id[key]
                break
            }
        }
        return product
    },
    // TODO: optimize to O(1)
    get_categ_by_name: function(name) {
        let categ_id
        for (let key in this.category_by_id) {
            if (this.category_by_id[key].name !== name) continue
            categ_id = this.category_by_id[key].id
        }
        return categ_id
    },
    add_child_orderline: function(parent_orderline_id, orderline_id, product_id, childProduct) {
        this.products_extra_by_orderline[orderline_id] = {
            orderline_id: orderline_id,
            parent_orderline_id: parent_orderline_id,
            parent_product_id: product_id,
            child_product: childProduct,
        }
    },
    add_product_to_sync: function(product_id, options, extra_components) {
        this.orderlines_to_sync.push({
            product_id: product_id,
            options: options,
            extra_components: extra_components
        })
    },
    _isEmployee: async function() {
        this.isEmployee = await rpc.query({
            model: 'pos.config',
            method: 'type_user',
            args: [1],
        })
    }
})
