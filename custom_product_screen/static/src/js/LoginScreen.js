/** @odoo-module **/

import { patch } from 'web.utils'
import LoginScreen from 'pos_hr.LoginScreen'

patch(LoginScreen.prototype, "prototype patch", {
    selectCashier: async function () {
        try {
            let employee = await this._selectCashier()
            if (!employee) return
            let userResponse = await this.showPopup(
                'TextInputPopup',
                { title: 'Ingrese su password.' }
            )
            if (!userResponse.confirmed) return
            let user = this.env.pos.get_cashier()
            console.log(user)
            console.log(userResponse.payload)
            let success = await this.env.pos.login(user.user_id, userResponse.payload, 2)
            if (success)
                this.back()
        } catch (e) {
            console.error(e)
        }
    },
    _selectCashier: async function () {
        try {
            if (this.env.pos.config.module_pos_hr) {
                let employeesList = this.env.pos.employees
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
                return employee;
            }
        } catch (e) {
            console.error(e)
        }
    }
})