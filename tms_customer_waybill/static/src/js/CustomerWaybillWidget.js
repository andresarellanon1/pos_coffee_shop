/** @odoo-module **/

import { Component, useState, onPatched, onWillUpdateProps } from "@odoo/owl";
import { registry } from "@web/core/registry";

/**
 * @typedef {Object} RyderViaje
 * @property {number} NoOperacion - E.g., 108
 * @property {number} NoViaje - E.g., 63622
 * @property {string} Origen - E.g., "108"
 * @property {string} Destino - E.g., ""
 * @property {string} TipoViaje - E.g., "DGO COM FORANEO SENCILLO"
 * @property {string} NoViajeCliente - E.g., "MOC 73902"
 * @property {string} FechaProgramadaPresentacion - E.g., "2023-10-13T10:00:00"
 * @property {string} FechaProgramadaDespacho - E.g., "2023-10-13T10:00:00"
 * @property {string} FechaEntrega - E.g., ""
 * @property {string} Existe_XML_I - E.g., "Si"
 * @property {string} Existe_XML_C - E.g., "No"
 */

/**
 * @typedef {Object} RemoteWaybillItem
 * @property {number} id - E.g., 108 
 * @property {number} name - E.g., 6322 
 */

/**
 * @typedef {Object} ActionObject
 * @property {string} id - E.g.,  "doTask"
 * @property {string} name - E.g., "Accept"
 */

/**
 * @typedef {Object} CustomerWaybillState
 * @property {string} customer - E.g., [] 
 * @property {string[]} headers - E.g., [] 
 * @property {ActionObject[]} actions - E.g., [] 
 * @property {RemoteWaybillItem[]} items - E.g., [] 
 */
export class CustomerWaybillWidget extends Component {
    // TODO: REPLACE SWITCH CASES WITH READING FROM AN ODOO MODEL CALLED PROCESSES OR SMTH LIKE THAT
    // CREATE ODOO MODULE TO STORE PROCESSES, USE ENDPOINT, CONTACT, AND A PROCESS NAME (REPLACE CONTACT WITH THIS NAME). 
    // ADD HEADERS,ACTIONS AND ITEMS KEYS and read them from here, acomplishing making this Owl component completly generic
    // NOTE: for now, we will work using switch cases.
    setup() {
        // @type {CustomerWaybillState}
        this.state = useState({
            customer: '',
            headers: [],
            actions: [],
            items: []
        })
        onWillUpdateProps(() => {
            console.log('will patch record:', this.props.record.data)
            this._patchStateSwitch()
        })
        onPatched(() => {
            console.log('record on patched:', this.props.record.data)
            console.log('state on patched', this.state)
        })
    }
    _patchStateSwitch() {
        if (!this.props.record.data.contact && !this.props.record.data.endpoint) return
        if (!this.props.record.data.remote_waybills) return
        this.state.customer = this.props.record.data.contact[1]
        switch (this.state.customer) {
            // A case for each customer use case
            case 'Ryder':
                this.state.headers = ['No. Viaje', 'No. Operacion']
                this.state.actions = [{ name: 'Load', id: 'loadRemoteWaybills' }]
                // @type {RyderViaje[]}
                this.state.items = []
                let tmp_items = this.props.recod.data.remote_waybills
                if (tmp_items && tmp_items.length >= 0) {
                    this.state.items = tmp_items.map(tmp => {
                        return {
                            id: tmp.NoViaje,
                            name: tmp.NoOperacion
                        }
                    })
                }
                break;
            default:
                break;
        }
    }
    async rpcActionCall(id, item) {
        try {
            args = {}
            // A case for each customer use case rpc method
            // Only prepare parameters, do customer specific logic on rpc method (python)
            switch (id) {
                case '_load_remote_waybills_as_pending':
                    args['NoViaje'] = item.NoViaje
                    args['NoOperacion'] = item.NoOperacion
                    break;
                default:
                    break;
            }
            await rpc.query({
                model: 'tms_customer_waybill.customer_waybill_wizard',
                method: `${id}`,
                args: [args],
            })
        } catch (e) {
            console.error(e)
            throw e
        }
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
// CustomerWaybillWidget.components = {}; // keep commented unless you are adding children components
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
