-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 025_actualizar_tarifas.sql
-- Descripción: Establecer tarifas base por tipo de vehículo
-- Dependencias: 017_tabla_vehicle_types.sql
-- ============================================

-- Tarifas base por tipo de vehículo
-- Estas se suman al cálculo: (km × price_per_km) + (min × price_per_minute) + base_fare
-- El price_per_km ahora viene de pricing_config, no de vehicle_types

UPDATE vehicle_types SET 
    base_fare = 100.00,
    price_per_km = 200.00
WHERE name = 'Moto';

UPDATE vehicle_types SET 
    base_fare = 150.00,
    price_per_km = 200.00
WHERE name = 'Básico';

UPDATE vehicle_types SET 
    base_fare = 200.00,
    price_per_km = 200.00
WHERE name = 'Confort';

UPDATE vehicle_types SET 
    base_fare = 250.00,
    price_per_km = 200.00
WHERE name = 'Mini Van';

-- Nota: El price_per_km en vehicle_types ya no se usa para el cálculo
-- El precio por km viene de pricing_config.price_per_km
-- Solo se mantiene por compatibilidad
