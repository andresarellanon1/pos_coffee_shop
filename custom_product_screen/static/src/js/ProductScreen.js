/** @odoo-module  **/

import { patch } from 'web.utils'
import ProductScreen from 'point_of_sale.ProductScreen'
import NumberBuffer from 'point_of_sale.NumberBuffer'
import { useExternalListener, onMounted, onRendered, useState } from '@odoo/owl';

patch(ProductScreen.prototype, "prototype patch", {
    setup() {
        onRendered(() => {
            if (this.env.isDebug()) {
                console.log('Rendered:', this.constructor.name);
            }
        });
        useExternalListener(window, 'click-product', this._clickProduct);
        useExternalListener(window, 'update-selected-orderline', this._updateSelectedOrderline);
        useExternalListener(window, 'select-line', this._selectLine);
        useExternalListener(window, 'set-numpad-mode', this._setNumpadMode);
        useExternalListener(window, 'click-product', this._clickProduct);
        useExternalListener(window, 'click-partner', this.onClickPartner);
        useExternalListener(window, 'click-pay', this._onClickPay);
                NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        });
        onMounted(this.onMounted);
        // Call `reset` when the `onMounted` callback in `NumberBuffer.use` is done.
        // We don't do this in the `mounted` lifecycle method because it is called before
        // the callbacks in `onMounted` hook.
        onMounted(() => NumberBuffer.reset());
        this.state = useState({
            mobile_pane: this.props.mobile_pane || 'right',
        });
    },
});

