/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import Registries from 'point_of_sale.Registries'

/**
 * Represents an item for displaying product templates in the Point of Sale.
 * @extends PosComponent
 */
class ProductTemplateItem extends PosComponent {
    setup() {
        super.setup()
    }
    /**
      * Get the URL for the image of the associated product.
      * @returns {string} The URL of the product's image.
      */
    get imageUrl() {
        let product = this.props.product
        return `/web/image?model=product.template&id=${product.id}&field=image_128`
    }
}

ProductTemplateItem.template = 'custom_product_screen.ProductTemplateItem'
Registries.Component.add(ProductTemplateItem)
