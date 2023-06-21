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
        this.createProductionSingle();
        this.sendCurrentOrderToMainPoS();
        this.env.pos.removeOrder(this.currentOrder)
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
    async sendCurrentOrderToMainPoS(){
        let order = this.currentOrder;
        let orderlines = order.get_orderlines();
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
        // Remove child orderlines
        for (let index in orderlines) {
            for (let key in product_extra_by_orderline) {
                if (product_extra_by_orderline[key].orderline_id === orderlines[index].id)
                    order.remove_orderline(product_extra_by_orderline[key].orderline_id)
            }
        }
        let response = await fetch("http://127.0.0.1:8080/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(order)
        }) 
        console.warn('pos sessions sync');
        console.log(response);
        // TODO: remove child orderlines from current order
        // Gotta make sure to add the extra price to the product extra_price before sending to cashier PoS session otherwise the extras won't be paid
    }
}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen';
Registries.Component.add(ProductTemplateScreen);
