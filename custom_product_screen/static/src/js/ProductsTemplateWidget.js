/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent';
import Registries from 'point_of_sale.Registries';
import { useState } from '@odoo/owl';

/**
 * Represents a widget for displaying product templates in the Point of Sale.
 * @extends PosComponent
 */
class ProductTemplateWidget extends PosComponent {
    setup() {
        super.setup();
        this.state = useState({ currentOffset: 0 });
    }

    /**
     * Get the product templates to display.
     * @returns {Array} An array of product templates to display.
     */
    get productsTemplateToDisplay() {
        // TODO: add customizable menu feature, for now it's 0 default
        return this.env.pos.db.get_product_template_by_menu(0);
    }

    /**
     * Updates the list of product templates and triggers the 'switch-category' event.
     * @private
     */
    _updateproducttemplatelist() {
        this.render(true);
        this.trigger('switch-category', 0);
    }
}

ProductTemplateWidget.template = 'custom_product_screen.ProductTemplateWidget';
Registries.Component.add(ProductTemplateWidget);


