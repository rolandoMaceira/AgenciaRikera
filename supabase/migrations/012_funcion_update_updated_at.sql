-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 012_funcion_update_updated_at.sql
-- Descripción: Actualiza automáticamente el campo updated_at
-- Dependencias: Ninguna
-- ============================================

-- Función trigger que actualiza el campo updated_at
-- Se dispara automáticamente antes de cada UPDATE
-- Garantiza que siempre sepamos cuándo se modificó un registro

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
