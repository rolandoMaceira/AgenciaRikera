-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 003_tabla_driver_profiles.sql
-- Descripción: Datos adicionales para conductores
-- Dependencias: 002_tabla_profiles.sql
-- ============================================

-- Perfil extendido para conductores
-- Solo se crea cuando un usuario solicita ser conductor
-- Contiene documentos, verificación, estadísticas y ubicación en tiempo real
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculación con perfil principal
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Estado de verificación
    verification_status driver_verification_status DEFAULT 'not_started',
    verified_at TIMESTAMPTZ,
    
    -- Documentos de licencia
    license_number VARCHAR(50),
    license_expiry DATE,
    license_photo_url TEXT,
    
    -- Documentos de identidad
    identity_document_number VARCHAR(50),
    identity_document_photo_url TEXT,
    selfie_photo_url TEXT,
    
    -- Rating y estadísticas
    driver_rating DECIMAL(3,2) DEFAULT 5.00,
    driver_total_ratings INTEGER DEFAULT 0,
    total_trips_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    
    -- Nivel y progreso
    driver_level INTEGER DEFAULT 1,
    weekly_trips INTEGER DEFAULT 0,
    monthly_trips INTEGER DEFAULT 0,
    
    -- Comisión de la plataforma (%)
    commission_rate DECIMAL(4,2) DEFAULT 15.00,
    
    -- Ubicación en tiempo real
    is_online BOOLEAN DEFAULT FALSE,
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    last_location_update TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_driver_rating CHECK (
        driver_rating >= 1.00 AND driver_rating <= 5.00
    ),
    CONSTRAINT valid_commission CHECK (
        commission_rate >= 0 AND commission_rate <= 100
    )
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_verification ON driver_profiles(verification_status);

-- Índice para conductores online (búsqueda de conductores disponibles)
CREATE INDEX idx_driver_profiles_online ON driver_profiles(is_online) 
    WHERE is_online = TRUE;

-- Índice espacial para buscar conductores cercanos
CREATE INDEX idx_driver_profiles_location ON driver_profiles(current_latitude, current_longitude) 
    WHERE is_online = TRUE;
