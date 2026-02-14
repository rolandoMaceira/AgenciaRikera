-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 024_tabla_trip_ratings.sql
-- Descripción: Calificaciones de viajes
-- Dependencias: 023_tabla_trips.sql
-- ============================================

-- Calificaciones bidireccionales:
-- driver_rating: El pasajero califica al conductor (1-5 estrellas)
-- passenger_rating: El conductor califica al pasajero (1-5 estrellas)
--
-- Cada viaje tiene un solo registro de rating que contiene ambas calificaciones

CREATE TABLE trip_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Viaje (único por viaje)
    trip_id UUID UNIQUE NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    
    -- Calificación del pasajero al conductor (1-5)
    driver_rating INTEGER,
    driver_comment TEXT,
    driver_rated_at TIMESTAMPTZ,
    
    -- Calificación del conductor al pasajero (1-5)
    passenger_rating INTEGER,
    passenger_comment TEXT,
    passenger_rated_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validaciones
    CONSTRAINT valid_driver_rating CHECK (driver_rating >= 1 AND driver_rating <= 5),
    CONSTRAINT valid_passenger_rating CHECK (passenger_rating >= 1 AND passenger_rating <= 5)
);

-- Índices
CREATE INDEX idx_trip_ratings_trip ON trip_ratings(trip_id);
