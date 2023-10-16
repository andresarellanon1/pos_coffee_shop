/** @odoo-module **/

import ReceiptScreen from 'point_of_sale.ReceiptScreen';
import Registries from 'point_of_sale.Registries';

/**
 * Represents an extended version of the ReceiptScreen class in the Point of Sale.
 * @extends ReceiptScreen
 */
const PosCoffeeReceiptScreen = ReceiptScreen =>
    class extends ReceiptScreen {
        /**
         * Get the next screen to navigate to.
         * @returns {Object} An object containing the name of the next screen.
         */
        get nextScreen() {
            return { name: 'ProductTemplateScreen' };
        }
    };

Registries.Component.extend(ReceiptScreen, PosCoffeeReceiptScreen);
return ReceiptScreen;

