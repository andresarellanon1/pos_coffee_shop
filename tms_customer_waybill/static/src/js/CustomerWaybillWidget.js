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
 * @typedef {Object} CustomerWaybillState
 * @property {string} customer - E.g., [] 
 * @property {string[]} headers - E.g., [] 
 * @property {string[]} actions - E.g., [] 
 * @property {RemoteWaybillItem[]} items - E.g., [] 
 */
export class CustomerWaybillWidget extends Component {
    setup() {
        // @type {CustomerWaybillState}
        this.state = useState({
            customer: '',
            headers: [],
            actions: [],
            items: []
        })
        onWillUpdateProps(async () => {
            await this.updateState()
        })
        onPatched(() => {
            console.log('state on patched', this.state)
        })
    }
    async updateState() {
        try {
            if (this.props.record.data.contact && this.props.record.data.endpoint) {
                console.log('record:', this.props.record)
                console.log('value:', this.props.value)
                this.state.customer = this.props.record.data.contact[1]
                switch (this.state.customer) {
                    // Bussiness (customer) specific logic inside named cases
                    case 'Ryder':
                        if (!this.props.value.Data) break;
                        this.state.headers = ['No. Viaje', 'No. Operacion']
                        this.state.actions = ['loadRemoteWaybills']
                        // @type {RyderViaje[]}
                        let tmp_items = this.props.value.Data
                        this.state.items = []
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
        } catch (e) {
            console.error(e)
        }
    }
    async loadRemoteWaybills(id) {
        try {
            switch (this.state.customer) {
                case 'Ryder':
                    let item = this.state.items.find(element => element.id === id)
                    let endpoints = await rpc.query({
                        model: 'q_endpoint_catalog.q_endpoint',
                        method: 'get_endpoint_ids_by_contact_name',
                        args: ['Quadro Soluciones'],
                    })
                    let endpoint = endpoints.find(value => value.name === '');
                    let response = await rpc.query({
                        model: 'q_endpoint_catalog.q_endpoint',
                        method: 'send_request',
                        args: [
                            endpoint.id,
                            [],
                            []
                        ],
                    });
                    let params = {}
                    params[''] =
                        await rpc.query({
                            model: 'tms_customer_waybill.customer_waybill_wizard',
                            method: `load_remote_waybill_as_pending`,
                            args: [{ params: params }],
                        })
                    break;
                default:
                    break;
            }

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
