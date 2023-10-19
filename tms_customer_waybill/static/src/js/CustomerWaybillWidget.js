/** @odoo-module **/

import { useState } from '@odoo/owl';
// import { standardFieldProps } from "@web/views/fields/standard_field_props";
// import { Component } from "@odoo/owl";
import { AbstractField } from 'web.AbstractField'
import { registry } from "@web/core/registry";

export class CustomerWaybillWidget extends AbstractField {
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

CustomerWaybillWidget.props = { ...standardFieldProps.props };
CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
