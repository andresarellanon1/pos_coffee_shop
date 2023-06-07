/** @odoo-module **/

import PosComponent  from 'point_of_sale.PosComponent';
import Registries from 'point_of_sale.Registries'

class ProductTemplateItem extends PosComponent {
    setup(){
        super.setup()
    }
    get imageUrl() {
        let product = this.props.product;
        return `/web/image?model=product.template&id=${product.id}&field=image_128&unique=${product.__last_update}`;
    }
}

ProductTemplateItem.template = 'custom_product_screen.ProductTemplateItem';
Registries.Component.add(ProductTemplateItem)
