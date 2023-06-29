/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import ControlButtonsMixin from 'point_of_sale.ControlButtonsMixin'
import Registries from 'point_of_sale.Registries'
import { onMounted, useExternalListener } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'
import NumberBuffer from 'point_of_sale.NumberBuffer'
import rpc from 'web.rpc'

class ProductTemplateScreen extends ControlButtonsMixin(PosComponent) {
    setup() {
        super.setup();
        useExternalListener(window, 'product-spawned', this.productSpawned);
        useExternalListener(window, 'click-pay', this._onClickPay);
        useExternalListener(window, 'click-send', this._onClickSend);
        useExternalListener(window, 'clear-order', this._clearOrder);
        useExternalListener(window, 'click-sync-next-order', this.fetchNextOrderFromQueue);
        useListener('click-product', this._clickProduct);
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
    get isEmployee(){
        return this.env.pos.db.isEmployee;
    }
    async productSpawned(event) {
        NumberBuffer.reset();
    }
    _clearOrder(event) {
        let order = this.currentOrder;
        this.env.pos.removeOrder(order);
    }
    _onClickPay() {
        this.createProductionSingle();
        this.showScreen('PaymentScreen');
    }
    _onClickSend() {
        this.createProductionSingle();
        this.sendCurrentOrderToMainPoS();
    }
    _onClickNext() {
        this.env.pos.removeOrder(this.currentOrder);
        this.fetchNextOrderFromQueue();
    }
    createProductionSingle() {
        let list_product = []
        let child_orderline = [];
        let order = this.currentOrder;
        let orderlines = order.get_orderlines()
        let parent_orderlines_id = [];
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
        // get parent orderlines ids
        for (let key in product_extra_by_orderline) {
            parent_orderlines_id.push(product_extra_by_orderline[key].parent_orderline_id);
        }
        // get child product list
        for (let index in orderlines) {
            for (let key in product_extra_by_orderline) {
                if (product_extra_by_orderline[key].orderline_id === orderlines[index].id)
                    child_orderline.push({
                        'id': orderlines[index].product.id,
                        'qty': orderlines[index].quantity,
                    });
            }
        }
        // get parent product list
        orderlines = orderlines.filter(or => parent_orderlines_id.includes(or.id));
        for (let i in orderlines) {
            // NOTE: inner loop is to ensure product spliting, in theory the orderlines are not merged ergo it should work without this
            // but we opted to keep it in case somehow multiple products end up in the same orderline (merged)
            // or a product with quantity > 1 end up having a merged orderline
            // products with quantity > 1 should not end up in the same orderline because they are added 1 at a time by the ProductSpawernScreen
            // and the orderlines are not being merged
            // TODO: Test with data from the UI and determine wheter or not products with qty > 1 are reaching this loop
            for (let j = 0; j < orderlines[i].quantity; j++) {
                let product_dict =
                    list_product.push({
                        'id': orderlines[i].product.id,
                        'qty': 1,
                        'product_tmpl_id': orderlines[i].product.product_tmpl_id,
                        'pos_reference': order.name,
                        'uom_id': orderlines[i].product.uom_id[0],
                        'components': child_orderline
                    });
            }
        }
        if (list_product.length == 0)
            return
        rpc.query({
            model: 'mrp.production',
            method: 'create_single_from_list',
            args: [1, list_product],
        });
    }
    async sendCurrentOrderToMainPoS() {
        let order = this.currentOrder;
        let orderlines = order.get_orderlines();
        let parent_orderlines_id = [];
        let product_sync = this.env.pos.db.products_to_sync;
        let response = await fetch("http://158.69.63.47:8080/order", {
            mode: 'no-cors',
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(product_sync)
        });
        console.warn('order sent to main pos response');
        console.log(response);
        if (response.status === 200) {
            this.env.pos.removeOrder(this.currentOrder);
            this.env.pos.db.products_to_sync = [];
        }
    }
    async fetchNextOrderFromQueue() {
        let response = await fetch("http://158.69.63.47:8080/order", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.status === 200) {
            let payload = await response.json();
            this.loadRemoteOrder(payload);
        }
    }
    async loadRemoteOrder(payload) {
        let product = this.env.pos.db.products_by_id[payload.product_id];
        let parent_orderline = await this._addProduct(product, payload.options);
        for (let component of payload.components) {
            let extra = this.env.pos.db.products_by_id[component.product_id];
            let options = {
                draftPackLotLines,
                quantity: component.qty,
                price_extra: 0.0,
                description: extra.display_name,
            };
            let child_orderline = await this._addProduct(extra, options);
            this.env.pos.db.add_child_orderline(parent_orderline.id, child_orderline.id, product.id, extra);
        }
        this.trigger('product-spawned');
        this.trigger('close-temp-screen');
    }

}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen';
Registries.Component.add(ProductTemplateScreen);
