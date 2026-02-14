-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 008_politicas_profiles.sql
-- Descripción: Políticas RLS para tabla profiles
-- Dependencias: 007_habilitar_rls.sql
-- ============================================

-- Política: Usuario puede ver su propio perfil
-- Permite SELECT solo si el id coincide con el usuario autenticado
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Política: Usuario puede actualizar su propio perfil
-- Permite UPDATE solo en su propio registro
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Política: Perfiles activos son visibles para usuarios autenticados
-- Permite que otros usuarios vean perfiles públicos (ej: nombre del conductor)
-- Solo muestra usuarios con status = 'active'
CREATE POLICY "Public profiles viewable"
    ON profiles FOR SELECT
    TO authenticated
    USING (status = 'active');
