-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 026_rls_trips.sql
-- Descripción: Políticas RLS para viajes y calificaciones
-- Dependencias: 023_tabla_trips.sql, 024_tabla_trip_ratings.sql
-- ============================================

-- Habilitar RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_ratings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: trips
-- ============================================

-- Pasajero puede ver sus viajes
CREATE POLICY "Passengers can view own trips"
    ON trips FOR SELECT
    USING (passenger_id = auth.uid());

-- Pasajero puede crear viajes
CREATE POLICY "Passengers can create trips"
    ON trips FOR INSERT
    WITH CHECK (passenger_id = auth.uid());

-- Conductor puede ver viajes asignados a él
CREATE POLICY "Drivers can view assigned trips"
    ON trips FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM driver_profiles WHERE user_id = auth.uid()
        )
    );

-- Usuarios autenticados pueden ver viajes pendientes (para asignación)
CREATE POLICY "Anyone can view pending trips"
    ON trips FOR SELECT
    TO authenticated
    USING (status = 'pending');

-- ============================================
-- POLÍTICAS: trip_ratings
-- ============================================

-- Usuarios pueden ver ratings de sus viajes
CREATE POLICY "Users can view own trip ratings"
    ON trip_ratings FOR SELECT
    USING (
        trip_id IN (
            SELECT id FROM trips 
            WHERE passenger_id = auth.uid() 
            OR driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
        )
    );

-- Usuarios pueden crear ratings de sus viajes
CREATE POLICY "Users can create trip ratings"
    ON trip_ratings FOR INSERT
    WITH CHECK (
        trip_id IN (
            SELECT id FROM trips 
            WHERE passenger_id = auth.uid() 
            OR driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
        )
    );

-- Usuarios pueden actualizar ratings de sus viajes
CREATE POLICY "Users can update own trip ratings"
    ON trip_ratings FOR UPDATE
    USING (
        trip_id IN (
            SELECT id FROM trips 
            WHERE passenger_id = auth.uid() 
            OR driver_id IN (SELECT id FROM driver_profiles WHERE user_id = auth.uid())
        )
    );
