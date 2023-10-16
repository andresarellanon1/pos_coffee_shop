/** @odoo-module **/

import Registries from 'point_of_sale.Registries';
import PosComponent from 'point_of_sale.PosComponent';

/**
 * Represents a custom orderline component in the Point of Sale.
 * @extends PosComponent
 */
class CustomOrderline extends PosComponent {
    /**
     * Gets the child orderlines associated with this orderline.
     * @returns {Array} An array of child orderlines.
     */
    get childOrderlines() {
        let orderlines = this.env.pos.get_order().get_orderlines();
        let child_orderline_by_orderline_id = this.env.pos.db.child_orderline_by_orderline_id;
        let orderline_id = this.props.line.id;
        let child_orderlines = [];

        for (let key in child_orderline_by_orderline_id) {
            if (child_orderline_by_orderline_id[key].parent_orderline_id === orderline_id) {
                child_orderlines.push(orderlines.find(line => line.id === child_orderline_by_orderline_id[key].orderline_id));
            }
        }

        return child_orderlines;
    }

    /**
     * Gets the URL of the image associated with the product on this orderline.
     * @returns {string} The URL of the product image.
     */
    get imageUrl() {
        let product = this.props.line.product;
        return `/web/image?model=product.template&id=${product.product_tmpl_id}&field=image_128`;
    }
}

CustomOrderline.template = 'custom_product_screen.CustomOrderline';
Registries.Component.add(CustomOrderline);


