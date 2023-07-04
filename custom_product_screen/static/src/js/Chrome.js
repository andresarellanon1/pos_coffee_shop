/** @odoo-module **/

import { patch } from 'web.utils'
import Chrome from 'point_of_sale.Chrome'

patch(Chrome.prototype, "getter/setter patch", {
    get startScreen() {
        if (this.state.uiState !== 'READY') {
            console.warn('ui state not ready')
        }
        return { name: 'ProductTemplateScreen' }
    }
});

