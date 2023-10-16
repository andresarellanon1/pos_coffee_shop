
from odoo import models, api


class StockScrap(models.Model):
    _inherit = 'stock.scrap'

    @api.model
    def mark_as_scrap(self, product_payload):
        """
        Mark a single product as scrap in the system.

        :param dict product_payload: A dictionary containing product information, including 'id', 'qty', and 'origin'.

        :return: The ID of the newly created scrap record.
        :rtype: int
        """
        vals = {
            'product_id': product_payload['id'],
            'scrap_qty': product_payload['qty'],
            'origin': product_payload['origin'],
            'company_id': self.env.user.company_id.id
        }
        scrap = self.sudo().create(vals)
        scrap.action_validate()
        return scrap.id

    @api.model
    def mark_as_scrap_list(self, product_list_payload):
        """
        Mark a list of products as scrap in the system.

        :param list product_list_payload: A list of dictionaries, where each dictionary contains product information,
        including 'id' and 'origin'.

        This method assumes that each product in the list has a scrap quantity of 1.

        :return: None
        """
        for product_payload in product_list_payload:
            vals = {
                'product_id': product_payload['id'],
                'scrap_qty': 1,
                'origin': product_payload['origin'],
                'company_id': self.env.user.company_id.id
            }
            scrap = self.sudo().create(vals)
            scrap.action_validate()
