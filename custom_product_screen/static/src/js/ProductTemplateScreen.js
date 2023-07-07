/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import ControlButtonsMixin from 'point_of_sale.ControlButtonsMixin'
import Registries from 'point_of_sale.Registries'
import { useExternalListener, onMounted, useState } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'
import rpc from 'web.rpc'

class ProductTemplateScreen extends ControlButtonsMixin(PosComponent) {
    setup() {
        super.setup();
        useExternalListener(window, 'click-pay', this._onClickPay);
        useExternalListener(window, 'click-send', this._onClickSend);
        useExternalListener(window, 'clear-order', this._onClearOrder);
        useExternalListener(window, 'click-sync-next-order', this._onClickNext);
        useListener('click-product', this._clickProduct);
        onMounted(this.onMounted);
        this.state = useState({
            skipNextMO: false,
        });

    }
    onMounted() {
        let order = this.currentOrder;
        this.env.pos.removeOrder(order);
        this.env.pos.add_new_order();
        this.env.pos.db.products_extra_by_orderline = {};
        this.env.pos.db.orderlines_to_sync = [];
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
    get skipNextMO() {
        return this.state.skipNextMO;
    }
    get isEmployee() {
        return this.env.pos.db.isEmployee;
    }
    _onClearOrder(event) {
        let order = this.currentOrder;
        this.env.pos.removeOrder(order);
        this.env.pos.add_new_order();
        this.env.pos.db.products_extra_by_orderline = {};
        this.env.pos.db.orderlines_to_sync = [];
    }
    async _onClickPay() {
        try {
            if (!this.state.skipNextMO) {
                this.createProductionSingle();
                await this.setNextOrder(3);
            }
            this.state.skipNextMO = false;
            // NOTE: do remove extra components orderlines before proceeding to payment screen to avoid duplicating stock.move (via stock.picking / mrp.production)
            for (let key in this.env.pos.db.products_extra_by_orderline) {
                let orderline = this.currentOrder.orderlines.find(or => or.id === this.env.pos.db.products_extra_by_orderline[key].orderline_id)
                this.currentOrder.remove_orderline(orderline)
            }
            this.env.pos.db.products_extra_by_orderline = {};
            this.env.pos.db.orderlines_to_sync = [];
            // NOTE: THis is required since the POST to /order (which sets the next UID to the production queue) only triggers from "client" session and not "employee" session
            this.showScreen('PaymentScreen');
        } catch (e) {
            console.error(e)
        }
    }
    async _onClickSend() {
        try {
            this.state.skipNextMO = false;
            this.createProductionSingle();
            await this.sendCurrentOrderToMainPoS(3);
            this.env.pos.db.products_extra_by_orderline = {};
            this.env.pos.db.orderlines_to_sync = [];
            let order = this.currentOrder;
            this.env.pos.removeOrder(order);
            this.env.pos.add_new_order();
        } catch (e) {
            console.error(e)
        }
    }
    async _onClickNext() {
        try {
            this.state.skipNextMO = false;
            this.env.pos.db.products_extra_by_orderline = {};
            this.env.pos.db.orderlines_to_sync = [];
            let order = this.currentOrder;
            this.env.pos.removeOrder(order);
            this.env.pos.add_new_order();
            let payload = await this.fetchNextOrderFromQueue(3);
            await this.loadRemoteOrder(payload)
        } catch (e) {
            console.error(e)
        }
    }
    async version(retry) {
        try {
            let response = await fetch("http://158.69.63.47:8080/version", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Content-Type": "*"
                },
            });
            if (response.status === 200)
                return
            if (retry > 0)
                await this.version(retry - 1)
        } catch (e) {
            console.error(e)
        }
    }
    /** everybody trigers production order alias:  MO / mrp.production / production / manufacturing order **/
    createProductionSingle() {
        let list_product = [];
        let child_orderline = [];
        let order = this.currentOrder;
        console.log(order);
        let orderlines = order.get_orderlines()
        let extras_orderlines_id = [];
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
        // get parent orderlines ids
        for (let key in product_extra_by_orderline) {
            extras_orderlines_id.push(product_extra_by_orderline);
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
        // filter mutate orderlines array to have only parent product list
        orderlines = orderlines.filter(or => !extras_orderlines_id.includes(or.id));
        for (let i in orderlines) {
            // NOTE: inner loop is to ensure product spliting, in theory the orderlines are not merged ergo it should work without this
            // but we opted to keep it in case somehow multiple products end up in the same orderline (merged)
            // or a product with quantity > 1 end up having a merged orderline
            // products with quantity > 1 should not end up in the same orderline because they are added 1 at a time by the ProductSpawernScreen
            // and the orderlines are not being merged
            // TODO: Test with data from the UI and determine wheter or not products with qty > 1 are reaching this loop
            for (let j = 0; j < orderlines[i].quantity; j++) {
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
        if (list_product.length === 0)
            return
        rpc.query({
            model: 'mrp.production',
            method: 'create_single_from_list',
            args: [1, list_product],
        });
    }
    /** only customer **/
    async sendCurrentOrderToMainPoS(retry) {
        try {
            await this.version(3)
            let orderlines_to_sync = this.env.pos.db.orderlines_to_sync;
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: this.currentOrder.name,
                    uid: this.currentOrder.uid,
                    orderlines: orderlines_to_sync
                })
            });
            console.warn('sendCurrentOrderToMainPoS:');
            console.log(response);
            if (response.status === 200)
                return
            if (retry > 0)
                await this.sendCurrentOrderToMainPoS(retry - 1)
        } catch (e) {
            console.error(e)
        }
    }
    /** only employee, this tells the manufacturing queue the order in which to bring the orders. The purpuso of this call is to imitate the way POST to /order pushes the UID at the end of the queue  **/
    async setNextOrder(retry) {
        try {
            await this.version()
            let order = this.currentOrder;
            let uid = order.name; // this icludes de Order-uid format
            let response = await fetch("http://158.69.63.47:8080/setNextProduction", {
                method: "POST",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uid: `POS-${uid}` })
            });
            console.warn('setNextOrder')
            console.log(response)
            if (response.status === 200)
                return
            if (retry > 0)
                await this.setNextOrder(retry - 1)
        } catch (e) {
            console.error(e)
        }
    }
    /** only employee **/
    async fetchNextOrderFromQueue(retry) {
        try {
            await this.version()
            let response = await fetch("http://158.69.63.47:8080/order", {
                method: "GET",
                headers: {
                    "Accept": "*",
                    "Content-Type": "application/json"
                },
            });
            console.warn('fetchNextOrderFromQueue')
            console.log(response)
            if (response.status === 200) {
                let payload = await response.json();
                this.state.skipNextMO = true;
                return payload
            }
            if (retry > 0)
                await this.fetchNextOrderFromQueue(retry - 1)
        } catch (e) {
            console.error(e)
        }
    }
    /** only employee **/
    async loadRemoteOrder(orderPayload) {
        try {
            this.currentOrder.name = orderPayload.name
            this.currentOrder.uid = orderPayload.uid
            for (let payload of orderPayload.orderlines) {
                let product = this.env.pos.db.product_by_id[payload.product_id];
                let parent_orderline = await this._addProduct(product, payload.options);
                // NOTE: ignoring the components when reading the remote order should be fine because the payload.options.extra_price should be the accumulated of
                // the product.price and the extra components price, done when spawned in the origin PoS Session
                // se we let this for loop here just to display the selected extra components in the OrderWidget
                // NOTE: remove this orderlines right before writing the stock.piciking, can be skiped in ticket.
                for (let component of payload.extra_components) {
                    let extra = this.env.pos.db.product_by_id[component.product_id];
                    let options = {
                        draftPackLotLines: undefined,
                        quantity: component.qty,
                        price_extra: 0.0,
                        description: extra.display_name,
                    };
                    let child_orderline = await this._addProduct(extra, options);
                    this.env.pos.db.add_child_orderline(parent_orderline.id, child_orderline.id, product.id, extra);
                }
            }
            this.trigger('product-spawned');
            this.trigger('close-temp-screen');
        } catch (e) {
            console.error(e)
        }
    }
    /* only use when fetching from queue */
    async _addProduct(product, options) {
        return await this.currentOrder.add_product_but_well_done(product, options);
    }

    /* only use when fetching from queue */
    get currentOrder() {
        return this.env.pos.get_order();
    }
}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen';
Registries.Component.add(ProductTemplateScreen);
