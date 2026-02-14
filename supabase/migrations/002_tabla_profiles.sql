-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 002_tabla_profiles.sql
-- Descripción: Tabla principal de perfiles de usuario
-- Dependencias: 001_tipos_enumerados.sql
-- ============================================

-- Perfiles de usuario (pasajeros y conductores)
-- Se vincula con auth.users de Supabase
-- Un usuario puede ser pasajero, conductor o ambos
CREATE TABLE profiles (
    -- Identificador único, vinculado a auth.users
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos de contacto
    phone VARCHAR(20) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    
    -- Datos personales
    full_name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    
    -- Ubicación
    province VARCHAR(50) DEFAULT 'La Habana',
    municipality VARCHAR(50),
    default_latitude DECIMAL(10,8),
    default_longitude DECIMAL(11,8),
    
    -- Roles
    is_passenger BOOLEAN DEFAULT TRUE,
    is_driver BOOLEAN DEFAULT FALSE,
    
    -- Sistema de referidos
    referral_code VARCHAR(10) UNIQUE,
    referred_by_code VARCHAR(10),
    referred_by_user_id UUID REFERENCES profiles(id),
    referral_count INTEGER DEFAULT 0,
    
    -- Billetera y estado
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    status user_status DEFAULT 'pending_verification',
    
    -- Rating como pasajero
    passenger_rating DECIMAL(3,2) DEFAULT 5.00,
    passenger_total_ratings INTEGER DEFAULT 0,
    
    -- Preferencias
    language VARCHAR(5) DEFAULT 'es',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_email CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
        OR email IS NULL
    ),
    CONSTRAINT valid_rating CHECK (
        passenger_rating >= 1.00 AND passenger_rating <= 5.00
    )
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON profiles(referred_by_user_id);
CREATE INDEX idx_profiles_status ON profiles(status);
