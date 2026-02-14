-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 021_rls_vehicles.sql
-- Descripción: Políticas RLS para tablas de vehículos
-- Dependencias: 017, 018, 019
-- ============================================

-- Habilitar RLS
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_type_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: vehicle_types
-- ============================================

-- Todos los usuarios autenticados pueden ver tipos de vehículo activos
CREATE POLICY "Anyone can view active vehicle types"
    ON vehicle_types FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- ============================================
-- POLÍTICAS: vehicles
-- ============================================

-- Conductor puede ver sus propios vehículos
CREATE POLICY "Drivers can view own vehicles"
    ON vehicles FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM driver_profiles WHERE user_id = auth.uid()
        )
    );

-- Conductor puede crear vehículos
CREATE POLICY "Drivers can insert own vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (
        driver_id IN (
            SELECT id FROM driver_profiles WHERE user_id = auth.uid()
        )
    );

-- Conductor puede actualizar sus vehículos (excepto status)
CREATE POLICY "Drivers can update own vehicles"
    ON vehicles FOR UPDATE
    USING (
        driver_id IN (
            SELECT id FROM driver_profiles WHERE user_id = auth.uid()
        )
    );

-- Pasajeros pueden ver vehículos activos y aprobados (para ver info del conductor)
CREATE POLICY "Passengers can view active approved vehicles"
    ON vehicles FOR SELECT
    TO authenticated
    USING (is_active = TRUE AND status = 'approved');

-- ============================================
-- POLÍTICAS: vehicle_type_assignments
-- ============================================

-- Conductor puede ver asignaciones de sus vehículos
CREATE POLICY "Drivers can view own assignments"
    ON vehicle_type_assignments FOR SELECT
    USING (
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN driver_profiles dp ON v.driver_id = dp.id
            WHERE dp.user_id = auth.uid()
        )
    );

-- Conductor puede crear asignaciones para sus vehículos
CREATE POLICY "Drivers can insert own assignments"
    ON vehicle_type_assignments FOR INSERT
    WITH CHECK (
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN driver_profiles dp ON v.driver_id = dp.id
            WHERE dp.user_id = auth.uid()
        )
    );

-- Usuarios autenticados pueden ver asignaciones aprobadas
CREATE POLICY "Anyone can view approved assignments"
    ON vehicle_type_assignments FOR SELECT
    TO authenticated
    USING (status = 'approved');
