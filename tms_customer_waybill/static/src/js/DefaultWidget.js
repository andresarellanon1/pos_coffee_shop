/** @odoo-module **/
import { Component } from "@odoo/owl";

export class DefaultWidget extends Component {
    setup() {
        // console.warn(this.props);
    }
    actionCall() {
        console.warn('Default action call')
        console.log(this.props)
    }
}

DefaultWidget.template = 'tms_customer_waybill.DefaultWidget';
