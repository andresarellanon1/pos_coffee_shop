/** @odoo-module **/

import { patch } from 'web.utils'
import PaymentScreen from 'point_of_sale.PaymentScreen'

/**
 * Represents a patched version of the PaymentScreen class in the Point of Sale.
 * @extends PaymentScreen
 */
patch(PaymentScreen.prototype, "getter/setter patch", {
    /**
     * Gets the next screen to navigate to based on the presence of an error.
     *
     * @returns {string} The name of the next screen.
     */
    get nextScreen() {
        return !this.error ? 'ReceiptScreen' : 'ProductTemplateScreen';
    }
});

/**
 * Represents a patched version of the PaymentScreen class in the Point of Sale.
 * @extends PaymentScreen
 */
patch(PaymentScreen.prototype, "async prototype patch", {
    /**
     * Extends the `_finalizeValidation` method to include additional steps.
     *
     * @returns {Promise} A promise that resolves when the finalization is complete.
     */
    async _finalizeValidation() {
        let _super = this._super.bind(this);
        await this.env.pos.confirmCurrentOrderMrpProduction();
        await this.env.pos.fixQueueForCurrentOrder(3);
        await _super(...arguments);
    }
});

