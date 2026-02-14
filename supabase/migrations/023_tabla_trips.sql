-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 023_tabla_trips.sql
-- Descripción: Viajes solicitados
-- Dependencias: profiles, driver_profiles, vehicles, vehicle_types
-- ============================================

-- Estados del viaje:
-- pending: Pasajero solicitó, buscando conductor
-- assigned: Conductor asignado, esperando aceptación
-- accepted: Conductor aceptó, va en camino
-- arrived: Conductor llegó al punto de recogida
-- in_progress: Viaje en curso
-- completed: Viaje terminado
-- cancelled: Cancelado (por pasajero o conductor)

CREATE TYPE trip_status AS ENUM (
    'pending',
    'assigned',
    'accepted',
    'arrived',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participantes
    passenger_id UUID NOT NULL REFERENCES profiles(id),
    driver_id UUID REFERENCES driver_profiles(id),
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
    
    -- Estado
    status trip_status DEFAULT 'pending',
    
    -- Origen
    origin_lat DECIMAL(10,8) NOT NULL,
    origin_lng DECIMAL(11,8) NOT NULL,
    origin_address TEXT,
    
    -- Destino
    destination_lat DECIMAL(10,8) NOT NULL,
    destination_lng DECIMAL(11,8) NOT NULL,
    destination_address TEXT,
    
    -- Distancia y tiempo
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    
    -- Precio
    base_fare DECIMAL(10,2) DEFAULT 0.00,
    distance_fare DECIMAL(10,2) DEFAULT 0.00,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Asignación
    assigned_at TIMESTAMPTZ,
    assignment_expires_at TIMESTAMPTZ,
    assignment_attempts INTEGER DEFAULT 0,
    
    -- Timestamps del viaje
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Cancelación
    cancelled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_trips_passenger ON trips(passenger_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_pending ON trips(status, vehicle_type_id) WHERE status = 'pending';
CREATE INDEX idx_trips_assigned ON trips(status, assignment_expires_at) WHERE status = 'assigned';
