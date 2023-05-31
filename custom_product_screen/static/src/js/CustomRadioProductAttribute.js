/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useState } from '@odoo/owl'

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
        console.warn('radio for attriubute:');
        console.warn(this.attribute);
        console.warn(this.values);
    }

    getValue() {
        let selected_value = this.values.find((val) => val.id === parseFloat(this.state.selected_value));
        console.log(selected_value);
        return selected_value;
    }
}

class CustomRadioProductAttribute extends BaseAttribute { }
CustomRadioProductAttribute.template = 'custom_product_screen.CustomRadioProductAttribute';
Registries.Component.add(CustomRadioProductAttribute);

