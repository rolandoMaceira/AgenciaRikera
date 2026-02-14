-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 013_funcion_verify_otp.sql
-- Descripción: Verifica código OTP y activa cuenta
-- Dependencias: 002_tabla_profiles.sql, 004_tabla_otp_codes.sql
-- ============================================

-- Verifica un código OTP enviado por SMS
-- Parámetros:
--   p_phone: Teléfono del usuario
--   p_code: Código de 4-6 dígitos
--   p_purpose: 'registration', 'password_reset', 'phone_change'
-- Retorna:
--   success: TRUE si el código es válido
--   message: Mensaje descriptivo
--   user_id: ID del usuario (si existe)

CREATE OR REPLACE FUNCTION verify_otp(
    p_phone VARCHAR(20),
    p_code VARCHAR(6),
    p_purpose VARCHAR(20) DEFAULT 'registration'
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    user_id UUID
) AS $$
DECLARE
    v_otp_record RECORD;
    v_user_id UUID;
BEGIN
    -- Buscar OTP válido (no verificado, no expirado)
    SELECT * INTO v_otp_record
    FROM otp_codes
    WHERE phone = p_phone
      AND purpose = p_purpose
      AND verified_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Validar que exista el OTP
    IF v_otp_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Código no encontrado o expirado'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Validar intentos máximos
    IF v_otp_record.attempts >= v_otp_record.max_attempts THEN
        RETURN QUERY SELECT FALSE, 'Máximo de intentos excedido'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Validar código
    IF v_otp_record.code != p_code THEN
        -- Incrementar contador de intentos
        UPDATE otp_codes SET attempts = attempts + 1 WHERE id = v_otp_record.id;
        RETURN QUERY SELECT FALSE, 'Código incorrecto'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Marcar OTP como verificado
    UPDATE otp_codes SET verified_at = NOW() WHERE id = v_otp_record.id;
    
    -- Si es registro, activar la cuenta
    IF p_purpose = 'registration' THEN
        UPDATE profiles 
        SET phone_verified = TRUE, status = 'active'
        WHERE phone = p_phone
        RETURNING id INTO v_user_id;
    ELSE
        -- Solo obtener el user_id para otros propósitos
        SELECT id INTO v_user_id FROM profiles WHERE phone = p_phone;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Verificación exitosa'::TEXT, v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
