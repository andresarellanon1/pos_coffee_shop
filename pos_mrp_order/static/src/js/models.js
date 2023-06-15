odoo.define('pos_mrp_order.models_mrp_order', function (require) {
"use strict";
var models = require('point_of_sale.models');
const PaymentScreen = require('point_of_sale.PaymentScreen');
const Registries = require('point_of_sale.Registries');
var rpc = require('web.rpc');

    const MRPPaymentScreen = (PaymentScreen) =>
        class extends PaymentScreen {
            constructor() {
                super(...arguments);
            }
            createMRP(){
            var list_product = []
            let child_product = [];
            const order = this.currentOrder;
            var orderlines = order.get_orderlines()
            var due = order.get_due();
            let parent_orderlines_id = [];
            let product_extra_by_orderline = this.env.pos.db.products_extra_by_orderline;
            // get parent orderlines ids
            for (let key in product_extra_by_orderline) { 
                    console.warn(product_extra_by_orderline[key]);
                parent_orderlines_id.push(product_extra_by_orderline[key].parent_orderline_id );  
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
                    console.warn('list product');
                    console.log(parent_orderlines_id);
                    console.log(orderlines);
            for (var i in orderlines){
                for(let j = 0; j < orderlines[i].quantity; j++){
                    var product_dict = {
                        'id': orderlines[i].product.id,
                        'qty': 1,
                        'product_tmpl_id': orderlines[i].product.product_tmpl_id,
                        'pos_reference': order.name,
                        'uom_id': orderlines[i].product.uom_id[0],
                        'components':  child_product
                    };
                    list_product.push(product_dict);
                }
            }

              if (list_product.length)
              {
                    console.warn('list product');
                    console.log(list_product);
                rpc.query({
                    model: 'mrp.production',
                    method: 'create_mrp_from_pos',
                    args: [1,list_product],
                    });
              }
        }
        get childOrderlines() {
            let order = this.currentOrder;
            let orderlines = order.get_orderlines()
                        return child_orderlines;
        }


            async validateOrder(isForceValidate) {
            if(this.env.pos.config.cash_rounding) {
                if(!this.env.pos.get_order().check_paymentlines_rounding()) {
                    this.showPopup('ErrorPopup', {
                        title: this.env._t('Rounding error in payment lines'),
                        body: this.env._t("The amount of your payment lines must be rounded to validate the transaction."),
                    });
                    return;
                }
            }
            if (await this._isOrderValid(isForceValidate)) {
                // remove pending payments before finalizing the validation
                for (let line of this.paymentLines) {
                    if (!line.is_done()) this.currentOrder.remove_paymentline(line);
                }
                await this._finalizeValidation();
            }
            this.createMRP();
        }
        };

    Registries.Component.extend(PaymentScreen, MRPPaymentScreen);

    return MRPPaymentScreen;

});
