/** @odoo-module **/

import ReceiptScreen from 'point_of_sale.ReceiptScreen'
import Registries from 'point_of_sale.Registries'

const PosCoffeeReceiptScreen = ReceiptScreen =>
    class extends ReceiptScreen {
        //@override
        get nextScreen() {
            return { name: 'ProductTemplateScreen' };
        };
    };

Registries.Component.extend(ReceiptScreen, PosCoffeeReceiptScreen);

return ReceiptScreen;