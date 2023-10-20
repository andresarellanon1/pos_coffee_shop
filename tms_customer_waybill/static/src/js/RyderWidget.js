/** @odoo-module **/
// import { useState } from '@odoo/owl';
import { Component } from "@odoo/owl";
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
export class RayderWidget extends Component {
    setup() {
    }

    actionCall() {
        console.warn('Ryder action call')
        console.log(this.props.item)
    }
}

RayderWidget.template = 'tms_customer_waybill.RayderWidget';
// registry.category('main_components').add('rayder_widget', RayderWidget);
