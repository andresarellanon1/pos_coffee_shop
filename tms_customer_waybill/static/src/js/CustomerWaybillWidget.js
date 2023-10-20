/** @odoo-module **/

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

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
