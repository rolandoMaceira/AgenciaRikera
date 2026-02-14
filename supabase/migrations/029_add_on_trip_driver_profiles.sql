-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 029_add_on_trip_driver_profiles.sql
-- Descripción: Agregar campo on_trip a driver_profiles
-- Dependencias: 003_tabla_driver_profiles.sql
-- ============================================

-- Campo para saber si el conductor está en un viaje activo
-- Cuando on_trip = TRUE, el conductor no recibe nuevas asignaciones
-- Se pone TRUE al aceptar un viaje y FALSE al completar o cancelar

ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS on_trip BOOLEAN DEFAULT FALSE;

-- Índice para búsqueda de conductores disponibles
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available 
    ON driver_profiles(is_online, on_trip, verification_status) 
    WHERE is_online = TRUE AND on_trip = FALSE AND verification_status = 'approved';
