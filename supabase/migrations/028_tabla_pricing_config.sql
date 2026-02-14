-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 028_tabla_pricing_config.sql
-- Descripción: Configuración de tarifas (editable por admin)
-- Dependencias: Ninguna
-- ============================================

-- Configuración centralizada de precios
-- Solo puede haber una configuración activa a la vez
-- Para cambiar precios, actualiza los valores de la configuración activa
--
-- Fórmula de precio:
-- total = MAX(min_price, (km × price_per_km) + (min × price_per_minute) + base_fare_vehiculo)

CREATE TABLE pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuración general
    min_price DECIMAL(10,2) NOT NULL DEFAULT 1000.00,      -- Precio mínimo de cualquier viaje
    price_per_km DECIMAL(10,2) NOT NULL DEFAULT 200.00,    -- Precio por kilómetro
    price_per_minute DECIMAL(10,2) NOT NULL DEFAULT 20.00, -- Precio por minuto de viaje
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Solo puede haber una configuración activa
CREATE UNIQUE INDEX idx_pricing_config_active ON pricing_config(is_active) WHERE is_active = TRUE;

-- Insertar configuración inicial
INSERT INTO pricing_config (min_price, price_per_km, price_per_minute) 
VALUES (1000.00, 200.00, 20.00);

-- Ejemplos de cómo cambiar precios:
-- UPDATE pricing_config SET min_price = 1500 WHERE is_active = TRUE;
-- UPDATE pricing_config SET price_per_km = 250 WHERE is_active = TRUE;
-- UPDATE pricing_config SET price_per_minute = 30 WHERE is_active = TRUE;
