-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 004_tabla_otp_codes.sql
-- Descripción: Códigos OTP para verificación SMS
-- Dependencias: Ninguna
-- ============================================

-- Códigos de verificación por SMS
-- Se generan al registrarse o recuperar contraseña
-- Expiran en 10 minutos y tienen máximo 3 intentos
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Teléfono destino
    phone VARCHAR(20) NOT NULL,
    
    -- Código de 4-6 dígitos
    code VARCHAR(6) NOT NULL,
    
    -- Propósito del código
    -- registration: Verificar registro
    -- password_reset: Recuperar contraseña
    -- phone_change: Cambiar número de teléfono
    purpose VARCHAR(20) DEFAULT 'registration',
    
    -- Control de intentos
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Expiración y verificación
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validación: código debe ser numérico de 4-6 dígitos
    CONSTRAINT valid_code CHECK (code ~ '^[0-9]{4,6}$')
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);
