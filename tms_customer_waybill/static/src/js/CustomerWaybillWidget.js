/** @odoo-module **/

import { useState } from '@odoo/owl';
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

export class CustomerWaybillWidget extends Component {
    setup() {
        console.warn(this.props);
        this.state = useState({
            remoteWaybills: [],
            reactive: this.props.value
        });
    }
    checkState() {
        console.warn(this.props.record)
        console.log(this.props.value)
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json', 'char', 'text']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
