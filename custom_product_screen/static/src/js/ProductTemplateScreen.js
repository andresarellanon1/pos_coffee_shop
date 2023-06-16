/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import ControlButtonsMixin from 'point_of_sale.ControlButtonsMixin'
import Registries from 'point_of_sale.Registries'
import { onMounted, useExternalListener } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'
import NumberBuffer from 'point_of_sale.NumberBuffer'

class ProductTemplateScreen extends ControlButtonsMixin(PosComponent) {
    setup() {
        super.setup();
        useExternalListener(window, 'product-spawned', this.productSpawned);
        useListener('click-product', this._clickProduct);
        useListener('click-pay', this._onClickPay);
        useListener('clear-order', this._clearOrder);
        NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        });
        onMounted(this.onMounted);
        onMounted(() => NumberBuffer.reset());
    }
    onMounted() {
        this.env.posbus.trigger('start-cash-control');
    }
    async _clickProduct(event) {
        let productTemplate = event.detail;
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined);
        this.trigger('close-temp-screen');
        await this.showTempScreen("ProductSpawnerScreen", {
            product: productTemplate,
            attributes: attributes,
        });
    }
    get currentOrder() {
        return this.env.pos.get_order();
    }
    async productSpawned(event) {
        NumberBuffer.reset();
    }
    _clearOrder(event) {
        let order = this.currentOrder;
        this.env.pos.removeOrder(order);
    }
    _onClickPay() {
        this.showScreen('PaymentScreen');
    }
}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen';
Registries.Component.add(ProductTemplateScreen);
