

def migrate(cr, version):
    """
    # rename vehicle fields from carta porte
    cr.execute('ALTER TABLE fleet_vehicle RENAME COLUMN "numPermisoSCT" TO sct_permit_number')
    cr.execute('ALTER TABLE fleet_vehicle RENAME COLUMN "permSCT" TO sct_permit')
    cr.execute('ALTER TABLE fleet_vehicle RENAME COLUMN conf_vehiculo TO vehicle_configuration')
    cr.execute('ALTER TABLE fleet_vehicle RENAME COLUMN subtipo_remolque TO trailer_subtype')
    cr.execute('ALTER TABLE fleet_vehicle RENAME COLUMN rentado TO rented')
    cr.execute('ALTER TABLE fleet_vehicle RENAME COLUMN arrendatario TO tenant')

    # rename fleet_vehicle_conf_vehiculo table
    cr.execute('ALTER TABLE fleet_vehicle_conf_vehiculo RENAME TO fleet_vehicle_configuration')
    cr.execute('ALTER TABLE fleet_vehicle_configuration RENAME COLUMN ejes TO axes')
    cr.execute('ALTER TABLE fleet_vehicle_configuration RENAME COLUMN llantas TO tires')
    cr.execute('ALTER TABLE fleet_vehicle_configuration RENAME COLUMN clave TO code')

    # rename fleet_vehicle_subt_remolque table
    cr.execute('ALTER TABLE fleet_vehicle_subt_remolque RENAME TO fleet_vehicle_trailer_subtype')
    cr.execute('ALTER TABLE fleet_vehicle_trailer_subtype RENAME COLUMN clave TO code')
    """