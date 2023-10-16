/** @odoo-module **/

import { patch } from 'web.utils'
import LoginScreen from 'pos_hr.LoginScreen'
import rpc from 'web.rpc'

patch(LoginScreen.prototype, "prototype patch", {
    selectCashier: async function() {
        this._super(...arguments)
        let endpoints = await rpc.query({
            model: 'q_endpoint_catalog.q_endpoint',
            method: 'get_endpoint_ids_by_contact_name',
            args: [1, 'Quadro Soluciones'],
        })
        this.env.pos.db.auth = await rpc.query({
            model: 'q_endpoint_catalog.q_endpoint',
            method: 'send_request',
            args: [{
                'record_id': endpoints[0], 
                'custom_headers': [], 
                'custom_attributes':[]
            }],
        })
    },
})
