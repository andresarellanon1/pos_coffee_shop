/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
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
export class CustomerWaybillWidget extends Component {
    setup() {
        console.warn('Remote Waybill props', this.props);
        this.state = useState({
            customer: '',
            headers: [],
            actions: [],
            items: []
        })
    }
    updateState() {
        if (!this.props.value) return
        if (this.props.record.data.contact) {
            this.state.customer === this.props.record.data.contact[1]
            switch (this.state.customer) {
                // Bussiness (customer) specific logic inside named cases
                case 'Ryder':
                    this.headers = ['No. viaje', 'No. Operacion']
                    this.actions = ['loadRemoteWaybills']
                    // @type {RyderViaje[]}
                    let tmp_items = this.props.value.data
                    if (tmp_items.lenght >= 0) {
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
    }
    async loadRemoteWaybills(id) {
        try {
            switch (this.state.customer) {
                case 'Ryder':
                    let item = this.state.items.find(element => element.id === id)
                    await rpc.query({
                        model: 'tms_customer_waybill.customer_waybill_wizard',
                        method: `load_remote_waybills_${this.state.customer}`,
                        args: [{ item: item }],
                    })
                    break;
                default:
                    break;
            }

        } catch (e) {
            console.error(e)
        }
    }
}

CustomerWaybillWidget.supportedFieldTypes = ['json']
CustomerWaybillWidget.template = 'tms_customer_waybill.CustomerWaybillWidget';
// CustomerWaybillWidget.components = {};
registry.category('fields').add('customer_waybill_widget', CustomerWaybillWidget);
