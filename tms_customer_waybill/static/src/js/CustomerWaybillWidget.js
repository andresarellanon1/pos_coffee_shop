/** @odoo-module **/

/**
 * NOTE
 * TLDR: we decided to make an unique Widget for each client so the we may 
 *
 * Given the nature of the JSON responses being unique to each client API
 * and the non predictable usage of the JSON attributes for each use case 
 * eg. X client uses a,b,c attributes to call xyz method but Y client uses d,e,f attributes to call xzy and zyx methods
 * 
 * The alternative is to provide a python model with an open field for inserting code but that would increase the complexity of the odoo-module 
 * while providing non extra benefits as if we just code a new widget for each use-case and add the name of the client to the if clausule.
 *
 * WARNING: The main problem that this approach will present is that changing the name of the contact asociated with a widget will esentially broke the 
 * wizzard functionality until a developer fix it
 */
// import { useState } from '@odoo/owl';
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

export class CustomerWaybillWidget extends Component {
    setup() {
        console.warn(this.props.record);
    }
    actionCall() {
        console.warn(this.props.record)
        console.log(this.props.value)
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json', 'char', 'text']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
