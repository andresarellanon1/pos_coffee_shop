/** @odoo-module **/

import { patch } from 'web.utils'
import LoginScreen from 'pos_hr.LoginScreen'

patch(LoginScreen.prototype, "prototype patch", {
    selectCashier: async function() {
        this._super(...arguments)
        let endpoints = await rpc.query({
            model: 'q_endpoint_catalog.q_endpoint',
            method: 'get_endpoint_ids_by_contact_name',
            args: [1, { 'contact_name': 'Quadro Soluciones' }],
        })
        let endpoint = endpoints.find(name => name === 'PoS External Service Login')
        this.env.pos.db.auth = await rpc.query({
            model: 'q_endpoint_catalog.q_endpoint',
            method: 'send_request',
            args: [1, endpoint.id],
        })
    },
})
