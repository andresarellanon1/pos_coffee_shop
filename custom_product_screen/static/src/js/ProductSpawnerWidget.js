/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useState } from '@odoo/owl'

class ProductSpawnerWidget extends PosComponent {}
ProductSpawnerWidget.template = 'custom_product_screen.ProductSpawnerWidget';
Registries.Component.add(ProductSpawnerWidget);

class BaseAttribute extends PosComponent {
    setup() {
        super.setup();
        this.env.attribute_components.push(this);
        this.attribute = this.props.attribute;
        this.values = this.attribute.values;
        this.state = useState({
            selected_value: parseFloat(this.values[0].id),
            custom_value: '',
        });
    }

    getValue() {
        let selected_value = this.values.find((val) => val.id === parseFloat(this.state.selected_value));
        let value = selected_value.name;
        if (selected_value.is_custom && this.state.custom_value) {
            value += `: ${this.state.custom_value}`;
        }

        return {
            value,
            extra: selected_value.price_extra
        };
    }
}

class CustomRadioProductAttribute extends BaseAttribute { }
CustomRadioProductAttribute.template = 'custom_product_screen.CustomRadioProductAttribute';
Registries.Component.add(CustomRadioProductAttribute);

