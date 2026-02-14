-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 009_politicas_driver_profiles.sql
-- Descripción: Políticas RLS para tabla driver_profiles
-- Dependencias: 007_habilitar_rls.sql
-- ============================================

-- Política: Conductor puede ver su propio perfil de conductor
CREATE POLICY "Users can view own driver profile"
    ON driver_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Conductor puede actualizar su propio perfil
-- Para subir documentos, cambiar estado online, etc.
CREATE POLICY "Users can update own driver profile"
    ON driver_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Política: Usuario puede crear su perfil de conductor
-- Se usa cuando un pasajero decide convertirse en conductor
CREATE POLICY "Users can insert own driver profile"
    ON driver_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Conductores activos y online son visibles
-- Permite que pasajeros vean conductores disponibles cercanos
-- Solo muestra conductores aprobados y conectados
CREATE POLICY "Active drivers viewable"
    ON driver_profiles FOR SELECT
    TO authenticated
    USING (verification_status = 'approved' AND is_online = TRUE);
