
/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent';
import ControlButtonsMixin from 'point_of_sale.ControlButtonsMixin';
import Registries from 'point_of_sale.Registries';
import { useExternalListener, onMounted, useState } from '@odoo/owl';
import { useListener } from '@web/core/utils/hooks';
import NumberBuffer from 'point_of_sale.NumberBuffer';

/**
 * Represents the product template screen in the Point of Sale.
 * @extends ControlButtonsMixin(PosComponent)
 */
class ProductTemplateScreen extends ControlButtonsMixin(PosComponent) {
    setup() {
        super.setup();
        useExternalListener(window, 'click-pay', this._onClickPay);
        useExternalListener(window, 'click-send', this._onClickSend);
        useExternalListener(window, 'clear-order', this._onClearOrder);
        useExternalListener(window, 'clear-orderline', this._onClearOrderline);
        useExternalListener(window, 'click-sync-next-order', this._onClickNext);
        useExternalListener(window, 'product-spawned', this._onProductSpawned);
        useExternalListener(window, 'product-dupe', this._onProductDupe);
        useListener('click-product', this._clickProduct);

        NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        });

        onMounted(this.onMounted);
    }

    onMounted() {
        NumberBuffer.reset();
        this.env.posbus.trigger('start-cash-control');

        if (!this.isEmployee) {
            $(document).find('.pos-topheader').addClass('oe_hidden');
        }

        let order = this.currentOrder;
        this.env.pos.removeOrder(order);
        this.env.pos.add_new_order();
    }

    /**
     * Get the current order.
     * @returns {Object} The current order.
     */
    get currentOrder() {
        return this.env.pos.get_order();
    }

    /**
     * Get whether the order line should skip MO (Manufacturing Orders).
     * @returns {boolean} `true` if the order line should skip MO, otherwise `false`.
     */
    get orderlineSkipMO() {
        return this.env.pos.db.orderlineSkipMO;
    }

    /**
     * Check if the current user is an employee.
     * @returns {boolean} `true` if the current user is an employee, otherwise `false`.
     */
    get isEmployee() {
        return this.env.pos.db.isEmployee;
    }

    /**
     * Handles duplicating a product on click.
     * @param {Event} event - The click event.
     */
    async _onProductDupe(event) {
        try {
            this.trigger('show-loader');
            let id = event.detail;
            let orderlines = this.currentOrder.get_orderlines();
            let orderline = orderlines.find(line => line.id === id);
            await this.env.pos.dupeSpawn(orderline);
            this.trigger('hide-loader');
        } catch (e) {
            this.trigger('hide-loader');
            this.showPopup('ErrorPopup', {
                title: 'Error al duplicar producto',
                body: JSON.stringify(e),
            });
        }
    }

    /**
     * Handles a click event on a product.
     * @param {Event} event - The click event.
     */
    async _clickProduct(event) {
        let productTemplate = event.detail;
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined);
        this.trigger('close-temp-screen');
        await this.showTempScreen('ProductSpawnerScreen', {
            product: productTemplate,
            attributes: attributes,
        });
    }

    /**
     * Handles clearing the current order.
     * @param {Event} event - The clear order event.
     */
    async _onClearOrder(event) {
        try {
            this.trigger('show-loader');
            await this.env.pos.clearCurrentOrderMrpProduction();
            let order = this.currentOrder;
            this.env.pos.removeOrder(order);
            this.env.pos.add_new_order();
            this.trigger('hide-loader');
        } catch (e) {
            let order = this.currentOrder;
            this.env.pos.markCurrentOrderAsScrap()
                .catch((e) => {
                    console.error(e);
                })
                .finally(() => {
                    this.trigger('hide-loader');
                    this.env.pos.removeOrder(order);
                    this.env.pos.add_new_order();
                });
        }
    }

    /**
     * Handles clearing a specific order line.
     * @param {Event} event - The clear order line event.
     */
    async _onClearOrderline(event) {
        try {
            this.trigger('show-loader');
            let orderline_id = event.detail;
            await this.env.pos.clearSingleMrpProduction(orderline_id);
            let orderline = this.currentOrder.orderlines.find(orderline => orderline.id === orderline_id);
            if (orderline) {
                this.currentOrder.remove_orderline(orderline);
            }
            this.trigger('hide-loader');
        } catch (e) {
            let orderline_id = event.detail;
            this.env.pos.markSingleAsScrap(orderline_id)
                .then((val) => {
                    console.log(val);
                    let orderline = this.currentOrder.orderlines.find(orderline => orderline.id === orderline_id);
                    if (orderline) {
                        this.currentOrder.remove_orderline(orderline);
                    }
                })
                .catch((e) => {
                    console.error(e);
                })
                .finally(() => {
                    this.trigger('hide-loader');
                });
        }
    }

    /**
     * Handles the click event for paying.
     * @param {Event} event - The click event.
     */
    async _onClickPay(event) {
        try {
            this.trigger('show-loader');
            await this.env.pos.createCurrentOrderMrpProduction();
            for (let key in this.env.pos.db.child_orderline_by_orderline_id) {
                let orderline = this.currentOrder.orderlines.find(orderline => `${orderline.id}` === key);
                if (!orderline) continue;
                this.currentOrder.remove_orderline(orderline);
            }
            this.showScreen('PaymentScreen');
            this.trigger('hide-loader');
        } catch (e) {
            this.trigger('hide-loader');
            this.showPopup('ErrorPopup', {
                title: 'Error al preparar pantalla de cobro',
                body: JSON.stringify(e),
            });
            console.error(e);
        }
    }

    /**
     * Handles the click event for syncing to the next order.
     * @param {Event} event - The click event.
     */
    async _onClickNext(event) {
        try {
            this.trigger('show-loader');
            let order = this.currentOrder;
            this.env.pos.removeOrder(order);
            this.env.pos.add_new_order();
            await this.env.pos.fetchOrderFromClientPoS(3);
            this.trigger('product-spawned');
            this.trigger('close-temp-screen');
            this.trigger('hide-loader');
        } catch (e) {
            this.trigger('hide-loader');
            this.showPopup('ErrorPopup', {
                title: 'Error al cargar orden desde la session remota',
                body: JSON.stringify(e),
            });
            console.error(e);
        }
    }

    /**
     * Handles the click event for sending the order to the remote session.
     * @param {Event} event - The click event.
     */
    async _onClickSend(event) {
        try {
            this.trigger('show-loader');
            await this.env.pos.createCurrentOrderMrpProduction();
            await this.env.pos.confirmCurrentOrderMrpProduction();
            await this.env.pos.sendOrderToMainPoS(3);
            let order = this.currentOrder;
            this.env.pos.removeOrder(order);
            this.env.pos.add_new_order();
            this.trigger('hide-loader');
        } catch (e) {
            this.trigger('hide-loader');
            this.showPopup('ErrorPopup', {
                title: 'Error al enviar orden a la session remota',
                body: JSON.stringify(e),
            });
            console.error(e);
        }
    }

    /**
     * Handles the event when a product is spawned.
     * Resets the NumberBuffer and hides the loader.
     */
    async _onProductSpawned(event) {
        NumberBuffer.reset();
        this.trigger('hide-loader');
    }
}

ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen';
Registries.Component.add(ProductTemplateScreen);

