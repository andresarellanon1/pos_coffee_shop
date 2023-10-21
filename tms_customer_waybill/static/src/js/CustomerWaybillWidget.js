/** @odoo-module **/

// import { useState } from '@odoo/owl';
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { RayderWidget } from "@tms_customer_waybill/js/RayderWidget"
import { DefaultWidget } from "@tms_customer_waybill/js/RayderWidget"

export class CustomerWaybillWidget extends Component {
    setup() {
        console.warn(this.props.record);
        console.log(RayderWidget)
    }
    actionCall() {
        console.warn(this.props.record)
        console.log(this.props.value)
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
CustomerWaybillWidget.components = { RayderWidget, DefaultWidget };
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
