/** @odoo-module **/

import { Component, useState, onWillUpdateProps } from "@odoo/owl";
import { registry } from "@web/core/registry";
import rpc from 'web.rpc'

export class CustomerWaybillWidget extends Component {
    setup() {
        this.state = useState({
            contact: {},
            prefix: {},
            headers: [],
            items: [],
            status: {}
        })
        onWillUpdateProps(async (_) => {
            if (!this.props.record.data.contact || !this.props.record.data.endpoint) return
            if (!this.props.record.data.remote_waybills) return
            this.state.items = []
            this.state.contact = { id: this.props.record.data.contact[0], name: this.props.record.data.contact[1] }
            this.state.prefix = await rpc.query({
                model: 'res.partner',
                method: 'get_prefix_by_partner_id',
                args: [this.state.contact.id],
            })
            let meta = await rpc.query({
                model: 'tms_customer_waybill.tms_api_waybill',
                method: `${this.state.prefix}_get_meta`,
                args: [],
            })
            this.state.headers = await rpc.query({
                model: 'tms_customer_waybill.tms_api_waybill',
                method: `${this.state.prefix}_get_headers`,
                args: [],
            })
            let buffer_items = await rpc.query({
                model: 'tms_customer_waybill.tms_api_waybill',
                method: `${this.state.prefix}_get_items`,
                args: [this.props.record.data.remote_waybills, this.state.contact.id],
            })
            if (buffer_items && buffer_items.length >= 0) {
                this.state.items = buffer_items.map(buffer_item => {
                    let item = {}
                    item.status = buffer_item.status
                    item.actions = []
                    for (let pair of meta.pairs) {
                        item[pair.key] = buffer_item[pair.value]
                    }
                    for (let action of meta.actions) {
                        let args = {
                            ContactId: this.state.contact.id
                        }
                        for (let arg of action.args) {
                            args[arg.key] = buffer_item[pair.value]
                        }
                        item.actions.push({
                            name: action.name,
                            callback: () => {
                                rpc.query({
                                    model: 'tms_customer_waybill.tms_api_waybill',
                                    method: `${this.state.prefix}_load_remote_waybills_as_pending`,
                                    args: [args],
                                })
                            }
                        })
                    }
                    return item
                })
            }
        })
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
