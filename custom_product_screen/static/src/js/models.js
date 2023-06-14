/** @odoo-module **/

import { patch } from 'web.utils'
import { PosGlobalState, Product, Order, Orderline } from 'point_of_sale.models'

patch(PosGlobalState.prototype, "prototype patch", {
    _processData: async function(loadedData) {
        this._loadProductTemplate(loadedData['product.template']);
        this._super(loadedData);
    },
    _loadProductTemplate: function(products) {
        this.db.add_products_templates(products)
    }
});

patch(Order.prototype, "prototype patch", {
    add_product: function(product, options) {
        this.assert_editable();
        options = options || {};
        var line = Orderline.create({}, { pos: this.pos, order: this, product: product });
        this.fix_tax_included_price(line);

        this.set_orderline_options(line, options);

        var to_merge_orderline;
        for (var i = 0; i < this.orderlines.length; i++) {
            if (this.orderlines.at(i).can_be_merged_with(line) && options.merge !== false) {
                to_merge_orderline = this.orderlines.at(i);
            }
        }
        if (to_merge_orderline) {
            to_merge_orderline.merge(line);
            this.select_orderline(to_merge_orderline);
        } else {
            this.add_orderline(line);
            this.select_orderline(this.get_last_orderline());
        }

        if (options.draftPackLotLines) {
            this.selected_orderline.setPackLotLines(options.draftPackLotLines);
        }
        return line;
    }
});

class Production extends PosModel {

}

