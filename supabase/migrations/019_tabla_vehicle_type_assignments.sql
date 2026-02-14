-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 019_tabla_vehicle_type_assignments.sql
-- Descripción: Relación N:N entre vehículos y tipos de servicio
-- Dependencias: 017_tabla_vehicle_types.sql, 018_tabla_vehicles.sql
-- ============================================

-- Asignación de tipos de servicio a cada vehículo
-- Un vehículo puede tener varios tipos (ej: Básico + Confort)
-- Confort requiere aprobación del admin

CREATE TYPE assignment_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TABLE vehicle_type_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id) ON DELETE CASCADE,
    
    -- Estado de aprobación
    status assignment_status DEFAULT 'pending',
    
    -- Aprobación (para tipos que requieren aprobación como Confort)
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un vehículo no puede tener el mismo tipo dos veces
    CONSTRAINT unique_vehicle_type UNIQUE (vehicle_id, vehicle_type_id)
);

-- Índices
CREATE INDEX idx_assignments_vehicle ON vehicle_type_assignments(vehicle_id);
CREATE INDEX idx_assignments_type ON vehicle_type_assignments(vehicle_type_id);
CREATE INDEX idx_assignments_status ON vehicle_type_assignments(status);
