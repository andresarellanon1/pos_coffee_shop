/** @odoo-module **/

import Registries from 'point_of_sale.Registries'
import PosComponent from 'point_of_sale.PosComponent'
import { useState } from '@odoo/owl'

class BaseAttribute extends PosComponent {
    setup() {
        super.setup()
        this.env.attribute_components.push(this)
        this.attribute = this.props.attribute
        this.values = this.attribute.values
        this.state = useState({
            selected_value: parseFloat(this.values[0].id),
            custom_value: '',
        })
        $(this.el).find('.checkmark-container').css("background-color", "#fff")
    }

    getValue() {
        return this.values.find((val) => val.id === parseFloat(this.state.selected_value))
    }
    // #F32417
    setChecked(event) {
        this.trigger('update-variant')
        $(this.el).find('.checkmark-container').css("background-color", "#fff")
        $(this.el).find('.checkmark-container').css("color", "#000")
        $(this.el).find(event.target.parentElement).css("background-color", "#dc3545")
        $(this.el).find(event.target.parentElement).css("color", "#fff")
    }
}

class CustomRadioProductAttribute extends BaseAttribute { }
CustomRadioProductAttribute.template = 'custom_product_screen.CustomRadioProductAttribute'
Registries.Component.add(CustomRadioProductAttribute)

