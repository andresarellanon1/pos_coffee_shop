/** @odoo-module **/

// import { Component } from "@odoo/owl";
// import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useState } from '@odoo/owl';
import AbstractField from 'web.AbstractField'
import { registry } from "@web/core/registry";


export var CustomerWaybillWidget = AbstractField.extend({
    supportedFieldTypes: ['json', 'text', 'char'],
    template: 'tms_customer_waybill.CustomerWaybillWidget',
    start: function() {

    },
    _renderEdit: function() {
        if (this.record.data.enable_bitmap) {
            this.renderCanvasFromHTML();
        }
    },
    _renderReadonly: function() {
        this._renderEdit();
    }
})

registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
