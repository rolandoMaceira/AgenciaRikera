-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 018_tabla_vehicles.sql
-- Descripción: Vehículos registrados por conductores
-- Dependencias: 003_tabla_driver_profiles.sql
-- ============================================

-- Vehículos de cada conductor
-- Un conductor puede tener varios vehículos pero solo uno activo
-- Todos los vehículos requieren aprobación del admin

CREATE TYPE vehicle_status AS ENUM (
    'pending_review',
    'approved',
    'rejected'
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Propietario del vehículo
    driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
    
    -- Datos del vehículo
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(30) NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Fotos
    photo_url TEXT,
    registration_photo_url TEXT,
    insurance_photo_url TEXT,
    
    -- Estado
    is_active BOOLEAN DEFAULT FALSE,
    status vehicle_status DEFAULT 'pending_review',
    
    -- Aprobación
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_year CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1)
);

-- Índices
CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_active ON vehicles(driver_id, is_active) WHERE is_active = TRUE;
