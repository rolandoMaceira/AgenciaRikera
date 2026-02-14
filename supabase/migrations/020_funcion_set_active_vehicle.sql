-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 020_funcion_set_active_vehicle.sql
-- Descripción: Activa un vehículo y desactiva los demás
-- Dependencias: 018_tabla_vehicles.sql
-- ============================================

-- Activa un vehículo como el vehículo principal del conductor
-- Automáticamente desactiva cualquier otro vehículo activo
-- Solo permite activar vehículos aprobados
--
-- Parámetros:
--   p_vehicle_id: ID del vehículo a activar
--   p_driver_id: ID del conductor (para verificación)
-- Retorna:
--   TRUE si se activó correctamente
--   FALSE si el vehículo no existe, no está aprobado o no pertenece al conductor

CREATE OR REPLACE FUNCTION set_active_vehicle(
    p_vehicle_id UUID,
    p_driver_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_vehicle_record RECORD;
BEGIN
    -- Verificar que el vehículo existe, está aprobado y pertenece al conductor
    SELECT * INTO v_vehicle_record
    FROM vehicles
    WHERE id = p_vehicle_id
      AND driver_id = p_driver_id
      AND status = 'approved';
    
    IF v_vehicle_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Desactivar todos los vehículos del conductor
    UPDATE vehicles
    SET is_active = FALSE
    WHERE driver_id = p_driver_id;
    
    -- Activar el vehículo seleccionado
    UPDATE vehicles
    SET is_active = TRUE
    WHERE id = p_vehicle_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
