-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 015_funcion_cleanup_expired_otps.sql
-- Descripción: Limpia códigos OTP expirados
-- Dependencias: 004_tabla_otp_codes.sql
-- ============================================

-- Elimina todos los códigos OTP que ya expiraron
-- Debe ejecutarse periódicamente mediante un cron job
-- Recomendación: ejecutar cada hora
--
-- Para configurar en Supabase:
-- 1. Ir a Database → Extensions → pg_cron
-- 2. Habilitar la extensión
-- 3. Ejecutar:
--    SELECT cron.schedule(
--        'cleanup-otps',
--        '0 * * * *',  -- Cada hora
--        'SELECT cleanup_expired_otps()'
--    );

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
