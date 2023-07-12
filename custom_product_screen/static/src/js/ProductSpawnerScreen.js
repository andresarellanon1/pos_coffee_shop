/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useSubEnv, useState, useExternalListener } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'

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
        for (let extra_component of this.env.extra_components) {
            let payload = extra_component.getValue()
            // ignore if component is 0 on UI
            if (payload.count <= 0 || payload.count > 5) continue
            component_products.push(payload)
            // accumulate extra component price on the main product
            price_extra = price_extra + payload.price_extra
        }
        let product = this.env.pos.db.get_product_by_attr(selected_attributes, this.product_template_id)
        // enforce 1 quantity created at a time
        let options = {
            draftPackLotLines,
            quantity: 1,
            price_extra: price_extra,
            description: ""
        }
        let parent_orderline = await this._addProduct(product, options)
        // NOTE: I can not think of another way to accumulate the price_extra on the product before creating the orderline
        // and at the same iteration add the child orderline because the child orderline requieres the parent orderline which is to wait until the price_extra of all componentes accumulates to be created
        for (let component of component_products) {
            // extra component orderline should not increase the order final price on it's own
            let options = {
                draftPackLotLines,
                quantity: component.count,
                price_extra: 0.0,
                description: component.display_name,
            }
            let child_orderline = await this._addProduct(component.extra, options)
            extra_components.push({ product_id: component.extra.id, qty: component.count })
            this.env.pos.db.add_child_orderline(parent_orderline.id, child_orderline.id, product.id, component.extra)
        }
        this.env.pos.db.add_product_to_sync(product.id, options, extra_components)
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
    // TODO: MAKE ES6
    _computeExtras(event) {
        // NOTE: Any changes to this block may result in undesired stock.move/stock.move.line
        // NOTE: Side effect: By using our list filtered by category 'Extra' required components are ignored since they're not extras
        // NOTE: WARNING: Adding a product that is a component in a BOM to the 'Extra' PoS category will make it appear here and be flexible consumed
        let categ_id = this.env.pos.db.get_categ_by_name('Extra')
        let extra_products = this.env.pos.db.get_product_by_category(categ_id)
        let bom = this.env.pos.db.boms_by_template_id[this.product_template_id]
        let bom_lines = this.env.pos.db.bom_lines_by_bom_id[bom.id]
        // NOTE: enable show only extra components that apply to the variant in the BOM line
        let selected_attributes_values = []
        for (let attribute_component of this.env.attribute_components) {
            let attribute = attribute_component.getValue()
            selected_attributes_values.push(attribute)
        }
        // NOTE: Only 1 attribute required in the variant to allow the extra component (change to 'every' to make it strictly look for all attribute ids required in the variant to allow the extra component)
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

