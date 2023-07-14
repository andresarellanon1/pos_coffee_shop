/** @odoo-module **/

import { patch } from 'web.utils'
import Chrome from 'point_of_sale.Chrome'
import { useState, useExternalListener } from '@odoo/owl'

patch(Chrome.prototype, "constructor patch", {
    setup() {
        this._super(...arguments)
        this.stateLoading = useState({
            isLoading: false
        })
        useExternalListener(window, 'show-loader', this._onShowLoader)
    }
})

patch(Chrome.prototype, "getter/setter patch", {
    get startScreen() {
        if (this.state.uiState !== 'READY') {
            console.warn('ui state not ready')
        }
        return { name: 'ProductTemplateScreen' }
    },
    get _isLoading() {
        return this.stateLoading.isLoading
    },
   set _onShowLoader(){
    
    }
})

