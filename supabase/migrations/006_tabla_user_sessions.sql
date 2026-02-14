-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 006_tabla_user_sessions.sql
-- Descripción: Sesiones y dispositivos de usuarios
-- Dependencias: 002_tabla_profiles.sql
-- ============================================

-- Registro de sesiones y dispositivos
-- Permite enviar notificaciones push
-- Controla dispositivos activos del usuario
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Usuario propietario de la sesión
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Información del dispositivo
    device_id VARCHAR(255),        -- ID único del dispositivo
    device_type VARCHAR(50),       -- 'android', 'ios', 'web'
    device_name VARCHAR(100),      -- 'iPhone 14', 'Samsung S23', etc.
    app_version VARCHAR(20),       -- '1.0.0', '1.2.3', etc.
    
    -- Token para notificaciones push (Firebase/APNs)
    push_token TEXT,
    
    -- Información de conexión
    ip_address INET,
    user_agent TEXT,
    
    -- Estado de la sesión
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_device ON user_sessions(device_id);
CREATE INDEX idx_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
