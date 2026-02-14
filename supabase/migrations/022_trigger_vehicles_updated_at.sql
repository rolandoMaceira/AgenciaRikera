-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 022_trigger_vehicles_updated_at.sql
-- Descripción: Trigger para actualizar updated_at en vehicles
-- Dependencias: 012_funcion_update_updated_at.sql, 018_tabla_vehicles.sql
-- ============================================

-- Actualiza automáticamente updated_at cuando se modifica un vehículo
CREATE TRIGGER trigger_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Actualiza automáticamente updated_at cuando se modifica un tipo de vehículo
CREATE TRIGGER trigger_vehicle_types_updated_at
    BEFORE UPDATE ON vehicle_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
