-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 027_trigger_trips_updated_at.sql
-- Descripción: Trigger para actualizar updated_at en trips
-- Dependencias: 012_funcion_update_updated_at.sql, 023_tabla_trips.sql
-- ============================================

-- Actualiza automáticamente updated_at cuando se modifica un viaje
CREATE TRIGGER trigger_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
