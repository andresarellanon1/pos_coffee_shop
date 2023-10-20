/** @odoo-module **/

import { useState } from '@odoo/owl';
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { bus } from 'web.core';

export class CustomerWaybillWidget extends Component {
    setup() {
        console.warn(this.props);
        this.state = useState({
            remoteWaybills: [],
            reactive: this.props.value
        });
        bus.on("field_changed:tms_customer_waybill.customer_waybill_wizard:remote_waybills", this, this.upateState);
    }
    // /**
    //  * @param {boolean} newValue
    //  */
    // onChange(newValue) {
    //     this.props.update(newValue);
    // }
    upateState() {
        console.warn(this.props.record)
        console.log(this.props.value)
        // this.state.remoteWaybills = this.props.record.value
    }


    // Add your component logic here
}

CustomerWaybillWidget.supportedFieldTypes = ['json', 'char', 'text']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
