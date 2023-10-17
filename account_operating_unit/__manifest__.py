# -*- coding: utf-8 -*-
{
    "name": 'Accounting with Operating Units',
    "summary": "Introduces Operating Unit fields in invoices and "
               "Accounting Entries with clearing account",
    "version": "16.0.0.0.1",
    "author": "Quadro Soluciones",
    "website": "http://www.quadrosoluciones.com",
    "license": "LGPL-3",
    "category": "Accounting & Finance",
    "depends": ['account', 'operating_unit', 'analytic_operating_unit'],
    "data": [
        "security/account_security.xml",
        "views/account_invoice_report_view.xml",
        "views/account_journal_view.xml",
        "views/account_move_view.xml",
        "views/account_payment_view.xml",
        "views/company_view.xml",
    ],
    'installable': True,
}
