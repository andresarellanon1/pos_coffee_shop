# -*- coding: utf-8 -*-
from odoo import models
from odoo.exceptions import UserError
from codecs import BOM_UTF8

BOM_UTF8U = BOM_UTF8.decode('UTF-8')

class AccountMove(models.Model):
    _inherit = 'account.move'

    def _generar_ubicaciones_extra(self, carta_porte, elemento_ubicacion):
        # Ubicacion Destino N
        ubicacion = {}
        origenODestino = 'DE'
        ubicacion['TipoUbicacion'] = 'Destino'
        ubicacion['IDUbicacion'] = origenODestino + \
            format(int(elemento_ubicacion.id), '06')
        ubicacion['FechaHoraSalidaLlegada'] = carta_porte.date_start.strftime("%Y-%m-%dT%H:%M:%S")
        ubicacion['RFCRemitenteDestinatario'] = elemento_ubicacion.vat or carta_porte.partner_id.vat or 'XEXX010101000'
        # Todo esto es sobre internacional 'XEXX010101000'
        ubicacion['NumRegIdTrib'] = carta_porte.partner_id.tax_id if ubicacion['RFCRemitenteDestinatario'] == 'XEXX010101000' else None
        ubicacion['ResidenciaFiscal'] = carta_porte.partner_id.country_id.l10n_mx_edi_code if ubicacion['RFCRemitenteDestinatario'] == 'XEXX010101000' else None
        # Este no se usa la primera vez
        ubicacion['DistanciaRecorrida'] = self.waybill_ids.travel_ids[0].distance_route / \
            (len(carta_porte.destination_ids) + 1)
        ubicacion['Domicilio'] = {}
        domicilio = {}
        domicilio['Calle'] = elemento_ubicacion.street_name or None
        domicilio['Colonia'] = elemento_ubicacion.colony.colony_code or None
        domicilio['Municipio'] = elemento_ubicacion.city_id.l10n_mx_edi_code or None
        domicilio['CodigoPostal'] = elemento_ubicacion.zip or None
        domicilio['Localidad'] = elemento_ubicacion.l10n_mx_edi_locality_id.code or None
        domicilio['Estado'] = elemento_ubicacion.state_id.code or None
        domicilio['Pais'] = elemento_ubicacion.country_id.l10n_mx_edi_code if ubicacion[
            'RFCRemitenteDestinatario'] != 'XEXX010101000' else carta_porte.partner_id.country_id.l10n_mx_edi_code or None
        ubicacion['Domicilio'] = domicilio

        # Validaciones
        if not domicilio['Calle']:
            raise UserError(
                "CALLE DESTINO - CARGA - CARTA PORTE - " + elemento_ubicacion.name)
        if not domicilio['CodigoPostal']:
            raise UserError(
                "C.P. DESTINO - CARGA - CARTA PORTE - " + elemento_ubicacion.name)
        if not domicilio['Estado']:
            raise UserError(
                "ESTADO DESTINO - CARGA - CARTA PORTE - " + elemento_ubicacion.name)
        if not domicilio['Pais']:
            raise UserError(
                "PAIS DESTINO - CARGA - CARTA PORTE - " + elemento_ubicacion.name)

        return ubicacion

    def _generar_ubicaciones(self):
        ubicaciones = []

        for carta_porte in self.waybill_ids:
            # Ubicacion Origen
            ubicacion = {}
            origenODestino = 'OR'
            ubicacion['TipoUbicacion'] = 'Origen'
            ubicacion['IDUbicacion'] = origenODestino + \
                format(int(carta_porte.departure_address_id.id), '06')
            ubicacion['FechaHoraSalidaLlegada'] = carta_porte.date_start.strftime("%Y-%m-%dT%H:%M:%S")
            ubicacion['RFCRemitenteDestinatario'] = carta_porte.departure_address_id.vat or carta_porte.partner_id.vat or 'XEXX010101000'
            # Todo esto es sobre internacional 'XEXX010101000'
            ubicacion['NumRegIdTrib'] = carta_porte.partner_id.tax_id if ubicacion['RFCRemitenteDestinatario'] == 'XEXX010101000' else None
            ubicacion['ResidenciaFiscal'] = carta_porte.partner_id.country_id.l10n_mx_edi_code if ubicacion['RFCRemitenteDestinatario'] == 'XEXX010101000' else None
            # Este no se usa la primera vez
            ubicacion['DistanciaRecorrida'] = None
            ubicacion['Domicilio'] = {}

            domicilio = {}
            domicilio['Calle'] = carta_porte.departure_address_id.street_name or None
            domicilio['CodigoPostal'] = carta_porte.departure_address_id.zip or None
            domicilio['Estado'] = carta_porte.departure_address_id.state_id.code or None
            domicilio['Pais'] = carta_porte.departure_address_id.country_id.l10n_mx_edi_code or None
            domicilio['Colonia'] = carta_porte.departure_address_id.colony.colony_code or None
            domicilio['Municipio'] = carta_porte.departure_address_id.city_id.l10n_mx_edi_code or None
            domicilio['Localidad'] = carta_porte.departure_address_id.l10n_mx_edi_locality_id.code or None
            ubicacion['Domicilio'] = domicilio

            # Validaciones
            if not domicilio['Calle']:
                raise UserError("CALLE ORIGEN - CARGA - CARTA PORTE")
            if not domicilio['CodigoPostal']:
                raise UserError("C.P. ORIGEN - CARGA - CARTA PORTE")
            if not domicilio['Estado']:
                raise UserError("ESTADO ORIGEN - CARGA - CARTA PORTE")
            if not domicilio['Pais']:
                raise UserError("PAIS ORIGEN - CARGA - CARTA PORTE")

            # Lista Ubicacion Origen
            ubicaciones.append(ubicacion)
            # Esto seguramente se puede sacar con el metodo de los multipless
            # Ubicacion Destino 01
            ubicacion = {}
            origenODestino = 'DE'
            ubicacion['TipoUbicacion'] = 'Destino'
            ubicacion['IDUbicacion'] = origenODestino + \
                format(int(carta_porte.arrival_address_id.id), '06')
            ubicacion['FechaHoraSalidaLlegada'] = carta_porte.date_start.strftime("%Y-%m-%dT%H:%M:%S")
            ubicacion['RFCRemitenteDestinatario'] = carta_porte.arrival_address_id.vat or carta_porte.partner_id.vat or 'XEXX010101000'
            # Todo esto es sobre internacional 'XEXX010101000'
            ubicacion['NumRegIdTrib'] = carta_porte.partner_id.tax_id if ubicacion['RFCRemitenteDestinatario'] == 'XEXX010101000' else None
            ubicacion['ResidenciaFiscal'] = carta_porte.partner_id.country_id.l10n_mx_edi_code if ubicacion['RFCRemitenteDestinatario'] == 'XEXX010101000' else None
            # Este no se usa la primera vez
            ubicacion['DistanciaRecorrida'] = self.waybill_ids.travel_ids[0].distance_route / \
                (len(carta_porte.destination_ids) + 1)
            ubicacion['Domicilio'] = {}
            domicilio = {}
            domicilio['Calle'] = carta_porte.arrival_address_id.street_name or None
            domicilio['Colonia'] = carta_porte.arrival_address_id.colony.colony_code or None
            domicilio['Municipio'] = carta_porte.arrival_address_id.city_id.l10n_mx_edi_code or None
            domicilio['CodigoPostal'] = carta_porte.arrival_address_id.zip or None
            domicilio['Localidad'] = carta_porte.arrival_address_id.l10n_mx_edi_locality_id.code or None
            domicilio['Estado'] = carta_porte.arrival_address_id.state_id.code or None
            domicilio['Pais'] = carta_porte.arrival_address_id.country_id.l10n_mx_edi_code or None
            ubicacion['Domicilio'] = domicilio

            # Validaciones
            if not domicilio['Calle']:
                raise UserError("CALLE DESTINO - CARGA - CARTA PORTE")
            if not domicilio['CodigoPostal']:
                raise UserError("C.P. DESTINO - CARGA - CARTA PORTE")
            if not domicilio['Estado']:
                raise UserError("ESTADO DESTINO - CARGA - CARTA PORTE")
            if not domicilio['Pais']:
                raise UserError("PAIS DESTINO - CARGA - CARTA PORTE")

            # Lista Ubicacion Destino
            ubicaciones.append(ubicacion)

            for destino_extra in carta_porte.destination_ids:
                ubicacion_extra = self._generar_ubicaciones_extra(
                    carta_porte, destino_extra)
                ubicaciones.append(ubicacion_extra)

        return ubicaciones

    def _preparar_mercancias(self):
        lista_de_mercancias = []

        for linea_de_carga in self.waybill_ids.transportable_line_ids:
            sat_merch_code_hm = linea_de_carga.sat_merchandise_code_id.hazardous_material
            mercancia = {}
            mercancia['BienesTransp'] = linea_de_carga.sat_merchandise_code_id.code
            mercancia['Cantidad'] = linea_de_carga.quantity
            mercancia['ClaveUnidad'] = linea_de_carga.transportable_uom_id.unspsc_code_id.code
            mercancia['Descripcion'] = linea_de_carga.name
            mercancia['PesoEnKg'] = linea_de_carga.merchandise_weight
            # Esta tiene que ver con exportacion
            mercancia['FraccionArancelaria'] = None
            # Material Peligroso
            mercancia['MaterialPeligroso'] = 'Sí' if sat_merch_code_hm == '1' or linea_de_carga.is_hazardous_material else 'No' if '0' in sat_merch_code_hm and '1' in sat_merch_code_hm else None
            mercancia['CveMaterialPeligroso'] = linea_de_carga.hazardous_material_id.code if mercancia['MaterialPeligroso'] == 'Sí' else None
            mercancia['Embalaje'] = linea_de_carga.packaging_code_id.code if mercancia['CveMaterialPeligroso'] else None
            mercancia['DescripEmbalaje'] = linea_de_carga.packaging_code_id.name if mercancia['Embalaje'] else None
            mercancia['CantidadTransporta'] = {
                'Cantidad': mercancia['Cantidad'],
                'IDOrigen': 'OR' + format(int(self.waybill_ids.departure_address_id.id), '06'),
                'IDDestino': 'DE' + format((int(linea_de_carga.destination_id.id) if linea_de_carga.destination_id else int(self.waybill_ids.arrival_address_id.id)), '06'),
            }

            # Validaciones
            if not mercancia['BienesTransp']:
                raise UserError(
                    "CODIGO SAT REQUERIDO - CARGA - CARTA PORTE")
            if not mercancia['Cantidad']:
                raise UserError("CANTIDAD - CARGA - CARTA PORTE")
            if not mercancia['ClaveUnidad']:
                raise UserError(
                    "CODIGO SAT UNIDAD DE MEDIDA REQUERIDO - CARGA - CARTA PORTE")
            if not mercancia['Descripcion']:
                raise UserError("DESCRIPCION REQUERIDO - CARTA PORTE")
            if not mercancia['PesoEnKg']:
                raise UserError(
                    "PESO EN KG REQUERIDO - CARGA - CARTA PORTE")

            # Esta tiene que ver con exportacion
            # Material Peligroso
            if linea_de_carga.is_hazardous_material:
                if not mercancia['CveMaterialPeligroso']:
                    raise UserError(
                        "CLAVE MATERIAL PELIGROSO REQUERIDO - CARGA - CARTA PORTE")
                if not mercancia['Embalaje']:
                    raise UserError(
                        "Embalaje Requerido - Carga - Carta Porte")
                if not mercancia['DescripEmbalaje']:
                    raise UserError(
                        "Descripcion Embalaje Requerido - Carga - Carta Porte")

            lista_de_mercancias.append(mercancia)
        return lista_de_mercancias

    def _preparar_figuras_transporte(self):
        listado_figuras_transporte = []
        for viaje in self.waybill_ids.travel_ids:
            figuraTransporte = {}
            figuraTransporte['TipoFigura'] = '01'
            figuraTransporte['RFCFigura'] = viaje.employee_id.l10n_mx_rfc
            figuraTransporte['NumLicencia'] = viaje.employee_id.driver_license

            # Esto deberia ser una lista
            figuraTransporte['PartesTransporte'] = None

            # Validaciones
            if not figuraTransporte['RFCFigura']:
                raise UserError(
                    "RFC OPERADOR REQUERIDO - CARGA - CARTA PORTE")
            if not figuraTransporte['NumLicencia']:
                raise UserError(
                    "LICENCIA OPERADOR REQUERIDA - CARGA - CARTA PORTE")
            # Agregar a la lista
            listado_figuras_transporte.append(figuraTransporte)
        return listado_figuras_transporte

    def _generar_datos_cartaporte(self):
        datos_cartaporte = {}

        # Todo esto es sobre internacional
        datos_cartaporte['TieneInformacionAduanera'] = None
        datos_cartaporte['NumeroPedimento'] = None
        datos_cartaporte['EsTranspInternac'] = None
        datos_cartaporte['EntradaSalidaMerc'] = None
        datos_cartaporte['ViaEntradaSalida'] = None
        datos_cartaporte['PaisOrigenDestino'] = None

        datos_cartaporte['TotalDistRec'] = self.waybill_ids.travel_ids[0].distance_route

        datos_cartaporte['Ubicaciones'] = self._generar_ubicaciones()

        datos_cartaporte['Mercancias'] = {
            'NumTotalMercancias': len(self.waybill_ids.transportable_line_ids),
            'PesoBrutoTotal': sum(self.waybill_ids.transportable_line_ids.mapped('merchandise_weight')),
            'UnidadPeso': 'KGM',
            'ListaMercancia': self._preparar_mercancias()
        }

        datos_cartaporte['TieneMaterialPeligroso'] = any(self.waybill_ids.transportable_line_ids.mapped('is_hazardous_material'))

        datos_cartaporte['Autotransporte'] = {
            'NumPermisoSCT': self.waybill_ids.travel_ids[0].unit_id.sct_permit_number,
            'PermSCT': self.waybill_ids.travel_ids[0].unit_id.sct_permit,
            'IdentificacionVehicular': {
                'AnioModeloVM': self.waybill_ids.travel_ids[0].unit_id.model_year,
                'ConfigVehicular': self.waybill_ids.travel_ids[0].unit_id.vehicle_configuration.code,
                'PlacaVM': self.waybill_ids.travel_ids[0].unit_id.license_plate,
            },
            'Seguros': {
                'AseguraRespCivil': self.waybill_ids.travel_ids[0].unit_id.insurance_supplier_id.name,
                'PolizaRespCivil': self.waybill_ids.travel_ids[0].unit_id.insurance_policy,
                'AseguraMedAmbiente': self.waybill_ids.travel_ids[0].unit_id.insurance_supplier_id.name,
                'PolizaMedAmbiente': self.waybill_ids.travel_ids[0].unit_id.insurance_policy,
            },
            'TieneRemolque1': any(self.waybill_ids.travel_ids.mapped('trailer1_id')),
            'TieneRemolque2': any(self.waybill_ids.travel_ids.mapped('trailer2_id')),
            'Remolques': [{
                'SubTipoRem': self.waybill_ids.travel_ids[0].trailer1_id.trailer_subtype.code if self.waybill_ids.travel_ids[0].trailer1_id else None,
                'Placa': self.waybill_ids.travel_ids[0].trailer1_id.license_plate if self.waybill_ids.travel_ids[0].trailer1_id else None,
            },
            {
                'SubTipoRem': self.waybill_ids.travel_ids[0].trailer2_id.trailer_subtype.code if self.waybill_ids.travel_ids[0].trailer2_id else None,
                'Placa': self.waybill_ids.travel_ids[0].trailer2_id.license_plate if self.waybill_ids.travel_ids[0].trailer2_id else None,
            }],
        }

        datos_cartaporte['FiguraTransporte'] = self._preparar_figuras_transporte()
        return datos_cartaporte
