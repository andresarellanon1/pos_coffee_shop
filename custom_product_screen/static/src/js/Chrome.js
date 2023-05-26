/** @odoo-module **/

import { patch } from 'web.utils'
import Chrome from 'point_of_sale.DB'

patch(Chrome.prototype, "prototype patch", {
    startScreen() {
        if (this.state.uiState !== 'READY') {
            console.warn('ui state not ready')
        }
        return { name: 'ProductTemplateScreen' }
    },
});
