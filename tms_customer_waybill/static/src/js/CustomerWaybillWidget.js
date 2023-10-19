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

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.components = { ...AbstractField.components };
CustomerWaybillWidget.props = { ...standardFieldProps.props };
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
