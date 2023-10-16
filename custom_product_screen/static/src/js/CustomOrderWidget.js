/** @odoo-module **/

import Registries from 'point_of_sale.Registries';
import PosComponent from 'point_of_sale.PosComponent';
import { useRef } from '@odoo/owl';
import { float_is_zero } from 'web.utils';

/**
 * Represents a custom order widget component in the Point of Sale.
 * @extends PosComponent
 */
class CustomOrderWidget extends PosComponent {
    setup() {
        super.setup();
        this.scrollableRef = useRef('scrollable');
    }

    /**
     * Gets the value of the 'skipNextMO' state property.
     * @returns {boolean} The value of 'skipNextMO'.
     */
    get skipNextMO() {
        return this.state.skipNextMO;
    }

    /**
     * Gets the current order from the Point of Sale.
     * @returns {Object} The current order.
     */
    get currentOrder() {
        return this.env.pos.get_order();
    }

    /**
     * Checks if the current user is an employee.
     * @returns {boolean} `true` if the user is an employee, `false` otherwise.
     */
    get isEmployee() {
        return this.env.pos.db.isEmployee;
    }

    /**
     * Gets an array of orderlines associated with products to sync by orderline ID.
     * @returns {Array} An array of orderlines.
     */
    get _orderlinesArray() {
        let orderlines = this.currentOrder ? this.currentOrder.get_orderlines() : [];
        let products_to_sync_by_orderline_id = Object.keys(this.env.pos.db.products_to_sync_by_orderline_id);
        let result = orderlines.filter(line => products_to_sync_by_orderline_id.includes(`${line.id}`));
        return result;
    }

    /**
     * Gets the total amount of the current order.
     * @returns {string} The formatted total amount with currency symbol.
     */
    getTotal() {
        return this.env.pos.format_currency(this.currentOrder.get_total_with_tax());
    }

    /**
     * Gets the tax amount for the current order.
     * @returns {Object} An object containing tax information:
     * - hasTax: `true` if there is tax, `false` if tax is zero.
     * - displayAmount: The formatted tax amount with currency symbol.
     */
    getTax() {
        const total = this.currentOrder.get_total_with_tax();
        const totalWithoutTax = this.currentOrder.get_total_without_tax();
        const taxAmount = total - totalWithoutTax;
        return {
            hasTax: !float_is_zero(taxAmount, this.env.pos.currency.decimal_places),
            displayAmount: this.env.pos.format_currency(taxAmount),
        };
    }
}

CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget';
Registries.Component.add(CustomOrderWidget);
