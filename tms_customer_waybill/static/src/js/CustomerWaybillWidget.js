/** @odoo-module **/

import { useState } from '@odoo/owl';
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

class CustomerWaybillWidget extends Component {
    setup() {
        this.state = useState({
            // Define your component's state here
        });
    }
    /**
     * @param {boolean} newValue
     */
    onChange(newValue) {
        this.props.update(newValue);
    }

    // Add your component logic here
}

CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
CustomerWaybillWidget.props = { ...standardFieldProps.props };
CustomerWaybillWidget.supportedFieldTypes = ['json']
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
