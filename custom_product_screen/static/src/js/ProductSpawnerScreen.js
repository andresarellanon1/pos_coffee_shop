/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useSubEnv, useState, useExternalListener } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'

/**
 * ProductSpawnerScreen component for handling product spawning in the Point of Sale.
 *
 * @extends PosComponent
 */
class ProductSpawnerScreen extends PosComponent {
    /**
     * Sets up the ProductSpawnerScreen component.
     *
     * @param {Object} options - Component options.
     */
    setup(options) {
        super.setup()
        this.product_template_id = this.props.product.id
        useSubEnv({ attribute_components: [], extra_components: [] })
        useListener('spawn-product', this.spawnProduct)
        useExternalListener(window, 'update-variant', this._computeExtras)
        this.state = useState({
            extra_components: [],
            index: 0
        })
    }

    /**
     * Asynchronously spawns a product with selected attributes and extra components.
     *
     * @param {Object} event - The event triggering the product spawning.
     * @returns {Promise} A promise that resolves when the product is spawned.
     */
    async spawnProduct(event) {
        this.trigger('show-loader')
        let selected_attributes = []
        let extra_components = []
        let draftPackLotLines, quantity
        let price_extra = 0.0
        for (let attribute_component of this.env.attribute_components) {
            let attribute = attribute_component.getValue()
            selected_attributes.push(attribute)
            price_extra = price_extra + attribute.price_extra
        }
        let product = this.env.pos.db.get_product_by_attr(selected_attributes, this.product_template_id)
        for (let extra_component of this.env.extra_components) {
            let component = extra_component.getValue()
            if (component.count <= 0 || component.count > 5) continue
            // Accumulate extra component price on the main product
            price_extra = price_extra + component.price_extra
        }
        let options = {
            draftPackLotLines,
            quantity: 1,
            price_extra: price_extra,
            description: ""
        }
        let parent_orderline = await this._addProduct(product, options)
        for (let extra_component of this.env.extra_components) {
            let component = extra_component.getValue()
            if (component.count <= 0 || component.count > 5) continue
            let options = {
                draftPackLotLines,
                quantity: component.count,
                price_extra: 0.0,
                description: component.display_name,
            }
            let child_orderline = await this._addProduct(component.extra, options)
            extra_components.push({ id: component.extra.id, qty: component.count })
            this.env.pos.db.add_child_orderline_by_orderline_id(parent_orderline.id, child_orderline.id)
        }
        this.env.pos.db.add_product_to_sync_by_orderline_id(parent_orderline.id, product.id, options, extra_components)
        this.trigger('product-spawned')
        this.trigger('close-temp-screen')
    }

    /**
     * Adds a product to the current order with the specified options.
     *
     * @param {Object} product - The product to add to the order.
     * @param {Object} options - Additional options for adding the product.
     * @returns {Promise} A promise that resolves when the product is added to the order.
     */
    async _addProduct(product, options) {
        return await this.currentOrder.add_product_prosime_resolve(product, options)
    }

    /**
     * Gets the current order from the Point of Sale.
     *
     * @returns {Object} The current order.
     */
    get currentOrder() {
        return this.env.pos.get_order()
    }

    /**
     * Gets the current Bill of Materials (BOM) lines.
     *
     * @returns {Array} An array of current BOM lines.
     */
    get currentBomLines() {
        return this.env.pos.db.bom_lines_by_bom_id[this.env.pos.db.boms_by_template_id[this.product_template_id].id]
    }

    /**
     * Gets extra components categorized as "Extra."
     *
     * @returns {Array} An array of extra components.
     */
    get currentProducts() {
        return this.env.pos.db.get_product_by_category(this.env.pos.db.get_categ_by_name('Extra'))
    }

    /**
     * Gets the extra components for display.
     *
     * @returns {Array} An array of extra components for display.
     */
    get getDisplayExtras() {
        return this.state.extra_components
    }

    /**
     * Gets product attributes.
     *
     * @returns {Array} An array of product attributes.
     */
    get getAttributes() {
        return this.props.attributes
    }

    /**
     * Gets selected product attributes.
     *
     * @returns {Array} An array of selected product attributes.
     */
    get selectedAttributes() {
        let selected_attributes_values = []
        for (let attribute_component of this.env.attribute_components) {
            let attribute = attribute_component.getValue()
            selected_attributes_values.push(attribute)
        }
        return selected_attributes_values
    }

    /**
     * Gets the index for attribute selection.
     *
     * @returns {number} The index for attribute selection.
     */
    get getIndex() {
        return this.state.index
    }

    /**
     * Computes and updates extra components based on selected attributes.
     *
     * @param {Object} event - The event triggering the computation.
     */
    _computeExtras(event) {
        if (this.state.index < this.getAttributes.length) this.state.index += 1
        // WARNING: ANY change in this block of code could result on unexpected stock.move or stock.move.line
        this.state.extra_components = []
        this.state.extra_components = this.currentProducts
            .filter(extra => this.currentBomLines
                .filter(bom_line => bom_line.bom_product_template_attribute_value_ids
                    .every(id => this.selectedAttributes.map(att => att.id).includes(id))
                    || bom_line.bom_product_template_attribute_value_ids.length === 0)
                .map(bom_line => bom_line.product_id[0])
                .includes(extra.id))
        for (let extra_component of this.env.extra_components) {
            extra_component.reset()
        }
    }
}

ProductSpawnerScreen.template = 'custom_product_screen.ProductSpawnerScreen'
Registries.Component.add(ProductSpawnerScreen)

