-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 017_tabla_vehicle_types.sql
-- Descripción: Tipos de vehículo/servicio disponibles
-- Dependencias: Ninguna
-- ============================================

-- Tipos de servicio que ofrece la plataforma
-- Moto: Servicio en motocicleta
-- Básico: Auto económico
-- Confort: Auto de mayor categoría (requiere aprobación)

CREATE TABLE vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información básica
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    -- Tarifas
    base_fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Capacidad
    max_passengers INTEGER NOT NULL DEFAULT 4,
    
    -- Configuración
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Orden de visualización en la app
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para ordenar en la app
CREATE INDEX idx_vehicle_types_order ON vehicle_types(display_order);

-- Insertar tipos de vehículo iniciales
INSERT INTO vehicle_types (name, description, max_passengers, requires_approval, display_order) VALUES
    ('Moto', 'Servicio rápido en motocicleta', 1, FALSE, 1),
    ('Básico', 'Auto económico para viajes cotidianos', 4, FALSE, 2),
    ('Confort', 'Auto de mayor categoría y comodidad', 4, TRUE, 3),
    ('Mini Van', 'Vehículo para grupos o equipaje extra', 7, TRUE, 4);
