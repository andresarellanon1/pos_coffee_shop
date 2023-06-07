/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useRef,useState } from '@odoo/owl'

class CustomOrderWidget extends PosComponent {
    setup(){
        super.setup();
        this.scrollableRef = useRef('scrollable');
    }
    get order(){
        return this.env.pos.get_order();
    }
    // TODO: cambiar filtro para filtrar por id
    get orderlinesArray(){
        let orderlines = this.order ? this.order.get_orderlines() : [];
        let result = orderlines.filter(or => this.isParentProductOrderline(or.product.id))
        return result;
    }
    isParentProductOrderline(product_id){
       if(this.env.pos.db.products_extra_by_product_id.find(pe => pe.parent_product_id === product_id))
            return true;
        return false;
    }
}

CustomOrderWidget.template = 'custom_product_screen.CustomOrderWidget';
Registries.Component.add(CustomOrderWidget);

