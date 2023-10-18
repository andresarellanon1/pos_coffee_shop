/** @odoo-module **/

import { Component, useState } from '@odoo/owl';

export class CustomerWaybillWidget extends Component {
    setup() {
        this.state = useState({
            // Define your component's state here
        });
    }

    // Add your component logic here
}

CustomerWaybillWidget.template = "tms_customer_waybill.CustomerWaybillWidget";
