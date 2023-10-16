/** @odoo-module **/

import { patch } from 'web.utils'
import PosDB from 'point_of_sale.DB'
import rpc from 'web.rpc'

/**
 * Represents a patched version of the PosDB class in the Point of Sale.
 * @extends PosDB
 */
patch(PosDB.prototype, "prototype patch", {
    /**
     * Initializes the PosDB with default values.
     *
     * @param {Object} options - The initialization options.
     */
    init(options) {
        /**
        * Products indexed by ID.
        * @type {Object.<number, Object>}
        */
        this.products_template_by_id = {}

        /**
         * Bill of Materials (BOMs) indexed by template ID.
         * @type {Object.<number, Object>}
         */
        this.boms_by_template_id = {}

        /**
         * BOM lines indexed by BOM ID.
         * @type {Object.<number, Object>}
         */
        this.bom_lines_by_bom_id = {}

        /**
         * Flag indicating whether the user is an employee.
         * @type {boolean}
         */
        this.isEmployee = false

        /**
         * Child orderlines indexed by orderline ID.
         * @type {Object.<number, Object>}
         */
        this.child_orderline_by_orderline_id = {}

        /**
         * Products to sync indexed by orderline ID.
         * @type {Object.<number, Object>}
         */
        this.products_to_sync_by_orderline_id = {}

        /**
         * Orderlines to sync indexed by production ID.
         * @type {Object.<number, Object>}
         */
        this.orderlines_to_sync_by_production_id = {}

        /**
         * Orderlines to skip in manufacturing orders.
         * @type {number[]}
         */
        this.orderlineSkipMO = []

        /**
         * Authentication token.
         * @type {string}
         */
        this.auth = ''
        this._super(options)
    },
    /**
      * Adds product templates to the database.
      *
      * @param {Object|Array} products - The product templates to add.
      */
    add_products_templates(products) {
        if (!(products instanceof Array)) {
            products = [products]
        }
        for (let product of products) {
            if (product === null) continue
            if (product.id in this.products_template_by_id) continue
            this.products_template_by_id[product.id] = product
        }
    },

    /**
     * Adds Bills of Materials (BOMs) to the database.
     *
     * @param {Object|Array} boms - The BOMs to add.
     */
    add_boms(boms) {
        for (let bom of boms) {
            this.boms_by_template_id[bom.product_tmpl_id[0]] = bom
            this.bom_lines_by_bom_id[bom.id] = []
        }
    },

    /**
     * Adds BOM lines to the database.
     *
     * @param {Object|Array} lines - The BOM lines to add.
     */
    add_bom_lines(lines) {
        try {
            for (let line of lines)
                this.bom_lines_by_bom_id[line.bom_id[0]].push(line)
        } catch (e) {
            // TODO: add popup error
            console.error('Most likely caused by a poor mrp.bom configuration')
            console.error(e)
        }
    },

    /**
     * Gets a list of product templates based on the menu ID.
     *
     * @param {number} menu_id - The menu ID to filter product templates.
     * @returns {Array} - The list of product templates.
     */
    get_product_template_by_menu(menu_id) {
        var list = []
        let categ_id = this.get_categ_by_name('Display') // TODO: move string literal to CONST string
        if (this.products_template_by_id) {
            for (let key in this.products_template_by_id) {
                let product = this.products_template_by_id[key]
                if (!(product.active && product.available_in_pos && product.pos_categ_id[0] === categ_id)) continue
                list.push(product)
            }
        }
        return list
    },

    /**
     * Gets a product based on selected attributes and product template ID.
     *
     * @param {Object} selected_attributes - The selected attributes.
     * @param {number} product_template_id - The product template ID.
     * @returns {Object} - The selected product.
     */
    get_product_by_attr(selected_attributes, product_template_id) {
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

    /**
     * Gets the category ID by name.
     *
     * @param {string} name - The name of the category.
     * @returns {number} - The category ID.
     */
    get_categ_by_name(name) {
        let categ_id
        for (let key in this.category_by_id) {
            if (this.category_by_id[key].name !== name) continue
            categ_id = this.category_by_id[key].id
        }
        return categ_id
    },

    // NOTE: Prepare extra components to show on UI based on the extra component orderline id
    // NOTE: Also used to filter unwanted orderlines before making inventory moves based on orderlines  
    /**
     * Adds child orderline information by orderline ID.
     *
     * @param {number} parent_orderline_id - The parent orderline ID.
     * @param {number} orderline_id - The orderline ID.
     */
    add_child_orderline_by_orderline_id(parent_orderline_id, orderline_id) {
        this.child_orderline_by_orderline_id[orderline_id] = {
            orderline_id: orderline_id,
            parent_orderline_id: parent_orderline_id
        }
    },

    // NOTE: Prepare orderlines and products to create mrp.production for each "parent orderline product",
    // the child_orderlines_ids are no longer relevant, so we store the raw list of components.
    /**
     * Adds a product to sync by orderline ID.
     *
     * @param {number} orderline_id - The orderline ID.
     * @param {number} product_id - The product ID.
     * @param {Object} options - Options for the product.
     * @param {Array} extra_components - Extra components associated with the product.
     */
    add_product_to_sync_by_orderline_id(orderline_id, product_id, options, extra_components) {
        this.products_to_sync_by_orderline_id[orderline_id] = {
            orderline_id: orderline_id,
            product_id: product_id,
            options: options,
            extra_components: extra_components
        }
    },

    // NOTE: "products_to_sync_by_orderline_id" and "orderlines_to_sync_by_production_id" are the same logic unit,
    // but "orderlines_to_sync_by_production_id" needs to create mrp.production and store the reference.
    /**
     * Adds an orderline to sync by production ID.
     *
     * @param {number} production_id - The production ID.
     * @param {number} orderline_id - The orderline ID.
     */
    add_orderline_to_sync_by_production_id(production_id, orderline_id) {
        this.orderlines_to_sync_by_production_id[production_id] = {
            production_id: production_id,
            orderline_id: orderline_id
        }
    },

    // TODO: move to pos global state
    /**
     * Checks if the current user is an employee.
     */
    _isEmployee: async function() {
        this.isEmployee = await rpc.query({
            model: 'pos.config',
            method: 'type_user',
            args: [],
        })
    }
});
