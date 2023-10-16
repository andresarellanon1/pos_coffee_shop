/** @odoo-module **/

import Registries from 'point_of_sale.Registries';
import PosComponent from 'point_of_sale.PosComponent';
import { useState } from '@odoo/owl';

/**
 * Represents an extra item in the Point of Sale component.
 * @extends PosComponent
 */
class ExtraItem extends PosComponent {
    setup() {
        super.setup();
        this.env.extra_components.push(this);
        this.extra = this.props.extra;
        this.limit = 5;
        this.state = useState({
            count: 0,
            price_extra: 0.0,
        });
    }

    /**
     * Resets the count and price of the extra item to zero.
     */
    reset() {
        this.state.count = 0;
        this.state.price_extra = 0.0;
    }

    /**
     * Gets the value of the extra item, including its extra, count, and price.
     * @returns {Object} An object containing extra, count, and price_extra.
     */
    getValue() {
        return {
            extra: this.extra,
            count: this.state.count,
            price_extra: this.state.price_extra,
        };
    }

    /**
     * Adds one extra item to the count and updates the price.
     */
    addExtra() {
        if (this.state.count < this.limit) {
            this.state.count += 1;
            this.state.price_extra += this.extra.lst_price;
        }
    }

    /**
     * Removes one extra item from the count and updates the price.
     */
    removeExtra() {
        if (this.state.count > 0) {
            this.state.count -= 1;
            this.state.price_extra -= this.extra.lst_price;
        }
    }

    /**
     * Gets the count of extra items.
     * @returns {number} The count of extra items.
     */
    get getCount() {
        return this.state.count;
    }

    /**
     * Gets the total price of extra items.
     * @returns {number} The total price of extra items.
     */
    get getPriceExtra() {
        return this.state.price_extra;
    }
}

ExtraItem.template = 'custom_product_screen.ExtraItem';
Registries.Component.add(ExtraItem);
