/** @odoo-module **/

import { Component, useState } from "@web/core";

class RayderCustomerWaybillWidget extends Component {
    setup() {
        this.state = useState({
            // Define your component's state here
        });
    }

    // Add your component logic here
}

RayderCustomerWaybillWidget.template = "tms_customer_waybill.customer_waybill_widget";
export default RayderCustomerWaybillWidget;
