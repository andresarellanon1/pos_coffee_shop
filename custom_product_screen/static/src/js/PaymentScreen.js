/** @odoo-module **/
import PaymentScreen from 'point_of_sale.PaymentScreen'
import rpc from 'web.rpc'
import { patch } from 'web.utils'

patch(PaymentScreen.prototype, "prototype patch", {
    createMRP: function() {
        var list_product = []
        let child_product = [];
        const order = this.currentOrder;
        var orderlines = order.get_orderlines()
        let parent_orderlines_id = [];
        let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
        // get parent orderlines ids
        for (let key in product_extra_by_orderline) {
            parent_orderlines_id.push(product_extra_by_orderline[key].parent_orderline_id);
        }
        // get child product list
        for (let index in orderlines) {
            for (let key in product_extra_by_orderline) {
                if (product_extra_by_orderline[key].parent_orderline_id === orderlines[index].id)
                    child_product.push({
                        'id': orderlines[index].product.id,
                        'qty': orderlines[index].quantity,
                    });
            }
        }
        // get parent product list
        orderlines = orderlines.filter(or => parent_orderlines_id.includes(or.id));
        for (var i in orderlines) {
            // NOTE: inner loop is to ensure product spliting, in theory the orderlines are not merged ergo it should work without this
            // but we opted to keep it in case somehow multiple products end up in the same orderline (merged)
            // or a product with quantity > 1 end up having a merged orderline
            // products with quantity > 1 should not end up in the same orderline because they are added 1 at a time by the ProductSpawernScreen
            // and the orderlines are not being merged
            // TODO: Test with data from the UI and determine wheter or not products with qty > 1 are reaching this loop
            for (let j = 0; j < orderlines[i].quantity; j++) {
                var product_dict = {
                    'id': orderlines[i].product.id,
                    'qty': 1,
                    'product_tmpl_id': orderlines[i].product.product_tmpl_id,
                    'pos_reference': order.name,
                    'uom_id': orderlines[i].product.uom_id[0],
                    'components': child_product
                };
                list_product.push(product_dict);
            }
        }

        if (list_product.length == 0)
            return
        rpc.query({
            model: 'mrp.production',
            method: 'create_single_from_list',
            args: [1, list_product],
        });
    },
    validateOrder: async function(isForceValidate) {
        if (this.env.pos.config.cash_rounding) {
            if (!this.env.pos.get_order().check_paymentlines_rounding()) {
                this.showPopup('ErrorPopup', {
                    title: this.env._t('Rounding error in payment lines'),
                    body: this.env._t("The amount of your payment lines must be rounded to validate the transaction."),
                });
                return;
            }
        }
        if (await this._isOrderValid(isForceValidate)) {
            for (let line of this.paymentLines) {
                if (!line.is_done()) this.currentOrder.remove_paymentline(line);
            }
            await this._finalizeValidation();
        }
        this.createMRP();
    }
});

