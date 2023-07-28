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
            extra_components: [],
            index: 0
        })
    }
    get imageUrl() {
        let product = this.props.product
        return `/web/image?model=product.template&id=${product.id}&field=image_128`
    }
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
        this.env.pos.db.add_product_to_sync_by_orderline_id(parent_orderline.id, product.id, options, extra_components)
        this.trigger('product-spawned')
        this.trigger('close-temp-screen')
    }

    async _addProduct(product, options) {
        return await this.currentOrder.add_product_but_well_done(product, options)
    }
    get currentOrder() {
        return this.env.pos.get_order()
    }
    get currentBomLines() {
        return this.env.pos.db.bom_lines_by_bom_id[this.env.pos.db.boms_by_template_id[this.product_template_id].id]
    }
    get currentProducts() {
        return this.env.pos.db.get_product_by_category(this.env.pos.db.get_categ_by_name('Extra'))
    }
    get getDisplayExtras() {
        return this.state.extra_components
    }
    get getAttributes() {
        return this.props.attributes

    }
    get selectedAttributes() {
        let selected_attributes_values = []
        for (let attribute_component of this.env.attribute_components) {
            let attribute = attribute_component.getValue()
            selected_attributes_values.push(attribute)
        }
        return selected_attributes_values
    }
    get getIndex() {
        return this.state.index
    }
    _computeExtras(event) {
        //NOTE: this method is not for this but i will make use of the listener to update the state.index
        if (this.state.index < this.getAttributes.length) this.state.index += 1
        // WARNING: Any changes to this block may result in undesired stock.move/stock.move.line
        // WARNING: Adding a product that is a component in a BOM to the 'Extra' PoS category will make it appear here and be flexible consumed 
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

