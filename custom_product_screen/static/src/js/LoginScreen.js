/** @odoo-module **/

import { patch } from 'web.utils';
import LoginScreen from 'pos_hr.LoginScreen';
import rpc from 'web.rpc';

/**
 * Represents a patched version of the LoginScreen class in the Point of Sale.
 * @extends LoginScreen
 */
patch(LoginScreen.prototype, "prototype patch", {
    /**
     * Extends the `selectCashier` method to allow selecting a cashier and performing authentication if necessary.
     *
     * @returns {Object} The selected cashier employee object.
     */
    selectCashier: async function() {
        if (this.env.pos.config.module_pos_hr) {
            const employeesList = this.env.pos.employees
                .filter((employee) => employee.id !== this.env.pos.get_cashier().id)
                .map((employee) => {
                    return {
                        id: employee.id,
                        item: employee,
                        label: employee.name,
                        isSelected: false,
                    };
                });

            let { confirmed, payload: employee } = await this.showPopup('SelectionPopup', {
                title: this.env._t('Change Cashier'),
                list: employeesList,
            });

            if (!confirmed) {
                return;
            }

            if (employee && employee.pin) {
                employee = await this.askPin(employee);
            }

            if (employee) {
                this.env.pos.set_cashier(employee);
            }

            let endpoints = await rpc.query({
                model: 'q_endpoint_catalog.q_endpoint',
                method: 'get_endpoint_ids_by_contact_name',
                args: ['Quadro Soluciones'],
            });

            let endpoint = endpoints.find(value => value.name === 'PoS External Service Login');

            let response = await rpc.query({
                model: 'q_endpoint_catalog.q_endpoint',
                method: 'send_request',
                args: [
                    endpoint.id,
                    [],
                    []
                ],
            });

            this.env.pos.db.auth = `Bearer ${response.token}`;

            return employee;
        }
    }
});
