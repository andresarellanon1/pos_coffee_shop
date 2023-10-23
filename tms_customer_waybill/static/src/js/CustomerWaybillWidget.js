/** @odoo-module **/

// import { useState } from '@odoo/owl';
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { RayderWidget } from "@tms_customer_waybill/js/RayderWidget"
import { DefaultWidget } from "@tms_customer_waybill/js/RayderWidget"

export class CustomerWaybillWidget extends Component {
    setup() {
        console.warn('Remote Waybill props', this.props);
    }
    get isRyder() {
        try {
            if (this.props.record.data.contact && this.record.data.contact[1] === 'Ryder')
                return true
            return false
        } catch (e) {
            return false
        }
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
CustomerWaybillWidget.components = { RayderWidget, DefaultWidget };
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
