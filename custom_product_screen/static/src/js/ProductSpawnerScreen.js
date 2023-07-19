/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useSubEnv, useState, useExternalListener } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'
import rpc from 'web.rpc'

class ProductSpawnerScreen extends PosComponent {
    setup(options) {
        super.setup()
        this.product_template_id = this.props.product.id
        useSubEnv({ attribute_components: [], extra_components: [] })
        useListener('spawn-product', this.spawnProduct)
        useExternalListener(window, 'update-variant', this._computeExtras)
        this.state = useState({
            extra_components: []
        })
    }
    async spawnProduct(event) {
        this.trigger('show-loader')
        let selected_attributes = []
        let component_products = []
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
            // accumulate extra component price on the main product
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
        console.warn('adding product to sync by orderline')
        console.log(this.env.pos.db.products_to_sync_by_orderline_id)
        this.env.pos.db.add_product_to_sync_by_orderline_id(parent_orderline.id, product.id, options, extra_components)
        console.log(this.env.pos.db.products_to_sync_by_orderline_id)
        this.trigger('product-spawned')
        this.trigger('close-temp-screen')
    }

    async _addProduct(product, options) {
        return await this.currentOrder.add_product_but_well_done(product, options)
    }
    get currentOrder() {
        return this.env.pos.get_order()
    }
    get getDisplayExtras() {
        return this.state.extra_components
    }
    _computeExtras(event) {
        // WARNING: Any changes to this block may result in undesired stock.move/stock.move.line
        // WARNING: Adding a product that is a component in a BOM to the 'Extra' PoS category will make it appear here and be flexible consumed 
        let categ_id = this.env.pos.db.get_categ_by_name('Extra')
        let extra_products = this.env.pos.db.get_product_by_category(categ_id)
        let bom = this.env.pos.db.boms_by_template_id[this.product_template_id]
        let bom_lines = this.env.pos.db.bom_lines_by_bom_id[bom.id]
        let selected_attributes_values = []
        for (let attribute_component of this.env.attribute_components) {
            let attribute = attribute_component.getValue()
            selected_attributes_values.push(attribute)
        }
        let selected_attributes_values_ids = selected_attributes_values.map(att => att.id)
        let bom_lines_variant = bom_lines.filter(line => selected_attributes_values_ids.some(att_id => line.bom_product_template_attribute_value_ids.includes(att_id)))
        let bom_lines_variant_product_ids = bom_lines_variant.map(line => line.product_id[0])
        this.state.extra_components = extra_products.filter(extra => bom_lines_variant_product_ids.includes(extra.id))
        for (let extra_component of this.env.extra_components) {
            extra_component.reset()
        }
    }
}
ProductSpawnerScreen.template = 'custom_product_screen.ProductSpawnerScreen'
Registries.Component.add(ProductSpawnerScreen)

