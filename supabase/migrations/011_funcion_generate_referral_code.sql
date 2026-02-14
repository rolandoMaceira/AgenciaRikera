-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 011_funcion_generate_referral_code.sql
-- Descripción: Genera código único de referido
-- Dependencias: Ninguna
-- ============================================

-- Genera un código aleatorio de 8 caracteres
-- Combina letras mayúsculas y números
-- Ejemplo: "A7X9K2M4", "B3N8P5Q1"
-- Se usa al crear nuevos usuarios

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(10) := '';
    i INTEGER;
BEGIN
    -- Generar 8 caracteres aleatorios
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
