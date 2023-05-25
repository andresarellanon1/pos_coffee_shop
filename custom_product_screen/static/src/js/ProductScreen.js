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
        /*
         NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        });
        */
        //onMounted(this.onMounted);
        // Call `reset` when the `onMounted` callback in `NumberBuffer.use` is done.
        // We don't do this in the `mounted` lifecycle method because it is called before
        // the callbacks in `onMounted` hook.
        //onMounted(() => NumberBuffer.reset());
        this.state = useState({
            mobile_pane: this.props.mobile_pane || 'right',
        });
    },
    async _clickProduct(event){
        if(!this.currentOrder){
            this.env.pos.add_new_order();
        }
        const productTemplateId = event.detail.id;
        // TODO: DETERMINAR SI EL PRODUCTO CLICKEADO TIENE VARIANTES
        // CASE 1: NO TIENE VARIANTES
        //      SE BUSCA EL PRODUCT.PRODUCT QUE LE CORRESPONDE AL TEMPLATE POR... PRODUCT.TEMPLATE.ID?
        // CASE 2: TIENE VARIANTES
        //      SE BUSCA EL PRODUCT.PRODUCT A PARTIR DE UNA INTERFAZ QUE PERMITE ELEGIR Y PERSONALIZAR EL PRODUCT TEMPLATE UTILIZANDO SUS ATRIBUTOS DISPONIBLES 
        //      AL FINAL DE LA INTERFAZ DE "COFFE MAKER" SE MOSTRARAN TODAS LAS POSIBLES VARIANTES DEL PRODUCT.TEMPLATE UTILIZANDO UN SISTEMA DE PANTALLAS QUE PREGNTE 
        //      UN ATRIBUTO A LA VEZ, COMO SE DEBE HACER SU CAFE.
        //      LAS COMBINACIONES IMPOSIBLES SE DEBERAN HACER A NIVEL DE ATRIBUTO, SIENDO ESTAS COMBINACIONES LAS QUE REQUIERAN DOS O MAS VALORES DISTINTOS PARA EL MISMO ATRIBUTO EJ. CAFE NORMAL Y CAFE DESCAFEINADO. ESTA COMBINACOON ES IMPOSIBLE DE GENERAR UTILIZANDO LA INTERFAZ YA QUE AL PREGUNTAR POR EL ATRIBUTO TIPO DE CAFE SE DEBERA SELECCIONAR 1 SOLO Y AVANZAR A LA SIGUIENTE PREGUNTA. ESTA DE MAS ACLARAR QUE DICHA COMBINACION TAMPOCO EXISTIRA EN EL BACKEND.
        const product = await this.showPopup("CoffeMaker");
    }
});

