/** @odoo-module **/

import { Component, useState, onWillUpdateProps } from "@odoo/owl";
import { registry } from "@web/core/registry";
import rpc from 'web.rpc'

/**
* TODO: REPLACE SWITCH CASES WITH READING FROM AN ODOO MODEL CALLED PROCESSES OR SMTH LIKE THAT
* CREATE ODOO MODULE TO STORE PROCESSES, USE ENDPOINT, CONTACT, AND A PROCESS NAME (REPLACE CONTACT WITH THIS NAME). 
* ADD HEADERS,ACTIONS AND ITEMS KEYS and read them from here, acomplishing making this Owl component completly generic
* NOTE: for now, we will work using switch cases.
* NOTE: main issue to develop this process model approach is to figure how a way to unwrap the data from the remote APIs 
* E.g, 
* this.props.record.data.remote_waybills.>>>Data<<<
*/

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
 * @property {ActionObject} name - E.g., 6322 
 */

/**
 * @typedef {Object} ActionObject
 * @property {string} name - E.g.,  "doTask"
 * @property {object} callbck- E.g., "()=>{}"
 */

/**
 * @typedef {Object} RemoteWaybillHeader
 * @property {string} displayName - E.g.,  "No. Viaje"
 * @property {string} key - E.g., "NoViaje"
 */

/**
 * @typedef {Object} CustomerWaybillState
 * @property {string} customer - E.g., [] 
 * @property {RemoteWaybillHeader[]} headers - E.g., [] 
 * @property {ActionObject[]} actions - E.g., [] 
 * @property {RemoteWaybillItem[]} items - E.g., [] 
 */
export class CustomerWaybillWidget extends Component {
    setup() {
        // @type {CustomerWaybillState}
        this.state = useState({
            customer: '',
            headers: [],
            items: []
        })
        onWillUpdateProps(() => {
            this._patchStateSwitch()
        })
    }
    _patchStateSwitch() {
        if (!this.props.record.data.contact || !this.props.record.data.endpoint) return
        if (!this.props.record.data.remote_waybills) return
        this.state.customer = this.props.record.data.contact[1]
        switch (this.state.customer) {
            case 'Ryder':
                this.state.headers = [
                    { displayName: 'No. Viaje', key: 'NoViaje' },
                    { displayName: 'No. Operacion', key: 'NoOperacion' },
                    { displayName: 'Actions', key: '' }]
                // @type {RyderViaje[]}
                this.state.items = []
                let tmp_items = this.props.record.data.remote_waybills.Data
                if (tmp_items && tmp_items.length >= 0) {
                    this.state.items = tmp_items.map(tmp => {
                        return {
                            id: tmp.NoViaje,
                            name: tmp.NoOperacion,
                            actions: [{
                                name: 'Load',
                                callback: () => {
                                    rpc.query({
                                        model: 'tms_customer_waybill.customer_waybill_wizard',
                                        method: 'load_remote_waybills_as_pending_ryder',
                                        args: [{
                                            NoViaje: tmp.NoViaje,
                                            NoOperacion: tmp.NoOperacion,
                                            ContactName: this.state.customer
                                        }],
                                    })
                                }
                            }]
                        }
                    })
                }
                break;
            default:
                break;
        }
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
// CustomerWaybillWidget.components = {}; // keep commented unless you are adding children components
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
