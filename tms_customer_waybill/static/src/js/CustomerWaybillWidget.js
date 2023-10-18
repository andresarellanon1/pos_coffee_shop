/** @odoo-module **/

import { useState } from '@odoo/owl';
import fieldRegistry from 'web.field_registry';
import AbstractField from 'web.AbstractField';

class CustomerWaybillWidget extends AbstractField {
    setup() {
        this.state = useState({
            // Define your component's state here
        });
    }

    // Add your component logic here
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.components = { ...AbstractField.components };
CustomerWaybillWidget.props = { ...AbstractField.props };
CustomerWaybillWidget.template = "tms_customer_waybill.CustomerWaybillWidget";
fieldRegistry.add("customer_waybill_widget", CustomerWaybillWidget);
export { CustomerWaybillWidget } 
