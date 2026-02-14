-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 016_triggers_updated_at.sql
-- Descripción: Triggers para actualizar updated_at automáticamente
-- Dependencias: 012_funcion_update_updated_at.sql
-- ============================================

-- Trigger para profiles
-- Cada vez que se actualiza un perfil, updated_at se actualiza automáticamente
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para driver_profiles
-- Cada vez que se actualiza un perfil de conductor, updated_at se actualiza
CREATE TRIGGER trigger_driver_profiles_updated_at
    BEFORE UPDATE ON driver_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- NOTA: El trigger on_auth_user_created ya NO se usa
-- El perfil se crea directamente desde la Edge Function 'register'
-- Esto nos da más control sobre el proceso de creación
