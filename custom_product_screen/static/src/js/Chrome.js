
/** @odoo-module **/

import { patch } from 'web.utils';
import Chrome from 'point_of_sale.Chrome';
import { useState, useExternalListener } from '@odoo/owl';

/**
 * Represents a patched version of the Chrome class in the Point of Sale.
 * @extends Chrome
 */
patch(Chrome.prototype, "constructor patch", {
    setup() {
        this._super(...arguments);
        this.stateLoading = useState({
            isLoading: false
        });
        useExternalListener(window, 'show-loader', this._onShowLoader);
        useExternalListener(window, 'hide-loader', this._onHideLoader);
    }
});

/**
 * Represents a patched version of the Chrome class in the Point of Sale.
 * @extends Chrome
 */
patch(Chrome.prototype, "getter/setter patch", {
    /**
     * Gets the start screen based on the UI state.
     * @type {Object}
     */
    get startScreen() {
        if (this.state.uiState !== 'READY') {
            console.warn('ui state not ready');
        }
        return { name: 'ProductTemplateScreen' };
    },

    /**
     * Gets the loading status.
     * @type {boolean}
     */
    get _isLoading() {
        return this.stateLoading.isLoading;
    }
});

/**
 * Represents a patched version of the Chrome class in the Point of Sale.
 * @extends Chrome
 */
patch(Chrome.prototype, "prototype patch", {
    /**
     * Event handler for showing the loader.
     */
    _onShowLoader: function() {
        this.stateLoading.isLoading = true;
    },

    /**
     * Event handler for hiding the loader.
     */
    _onHideLoader: function() {
        this.stateLoading.isLoading = false;
    }
});

