/** @odoo-module **/

import PosComponent from 'point_of_sale.PosComponent'
import ControlButtonsMixin from 'point_of_sale.ControlButtonsMixin'
import Registries from 'point_of_sale.Registries'
import { onMounted } from '@odoo/owl'
import { useListener } from '@web/core/utils/hooks'
import NumberBuffer from 'point_of_sale.NumberBuffer'

class ProductTemplateScreen extends ControlButtonsMixin(PosComponent) {
    setup() {
        super.setup();
        useListener('product-spawned', this.productSpawned)
        useListener('click-product', this._clickProduct)
        NumberBuffer.use({
            nonKeyboardInputEvent: 'numpad-click-input',
            triggerAtInput: 'update-selected-orderline',
            useWithBarcode: true,
        }); 
        onMounted(this.onMounted);
        onMounted(() => NumberBuffer.reset());
    }
    onMounted(){
        this.env.posbus.trigger('start-cash-control');
    }
    async _clickProduct(event) {
        let productTemplate = event.detail;
        // Filter attributes per product template attribute line
        let attributes = _.map(productTemplate.attribute_line_ids, (id) => this.env.pos.attributes_by_ptal_id[id])
            .filter((attr) => attr !== undefined);
        //console.warn(productTemplate);
        console.warn('Product Template Attributes by PTAL_ID');
        console.warn(attributes);
        await this.showTempScreen("ProductSpawnerScreen",{
            product: productTemplate,
            attributes: attributes,
        })
    }
    get currentOrder(){
        return ths.env.pos.get_order();
    }
    async productSpawned(event){
        console.warn('Product Product');
        let payload = event.detail;
        console.warn(payload);
        await this.currentOrder.add_product(payload.product_product, {
            draftPackLotLines,
            quantity,
            descripcion,
            price_extra
        });
        NumberBuffer.reset();
    }
}
ProductTemplateScreen.template = 'custom_product_screen.ProductTemplateScreen';
Registries.Component.add(ProductTemplateScreen);
