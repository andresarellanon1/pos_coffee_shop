/** @odoo-module  **/

import { patch } from 'web.utils'
import ProductScreen from 'point_of_sale.ProductScreen'
import NumberBuffer from 'point_of_sale.NumberBuffer'
import { useExternalListener, onMounted, useState } from '@odoo/owl';

patch(ProductScreen.prototype, "prototype patch", {
    setup(){
        useExternalListener(window,'click-product', this._clickProduct);
         onRendered(() => {
                if (this.env.isDebug()) {
                    console.log('Rendered:', this.constructor.name);
                }
            });
 
            useListener('update-selected-orderline', this._updateSelectedOrderline);
            useListener('select-line', this._selectLine);
            useListener('set-numpad-mode', this._setNumpadMode);
            useListener('click-product', this._clickProduct);
            useListener('click-partner', this.onClickPartner);
            useListener('click-pay', this._onClickPay);
            useBarcodeReader({
                product: this._barcodeProductAction,
                weight: this._barcodeProductAction,
                price: this._barcodeProductAction,
                client: this._barcodePartnerAction,
                discount: this._barcodeDiscountAction,
                error: this._barcodeErrorAction,
            });
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

