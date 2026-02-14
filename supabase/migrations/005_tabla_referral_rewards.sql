-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 005_tabla_referral_rewards.sql
-- Descripción: Historial de recompensas por referidos
-- Dependencias: 002_tabla_profiles.sql
-- ============================================

-- Registro de recompensas por sistema de referidos
-- Cuando un usuario invita a otro y completa su primer viaje
-- Ambos reciben recompensas en su billetera
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Usuario que invitó (recibe recompensa)
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Usuario invitado (recibe recompensa)
    referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Montos de recompensa
    referrer_reward DECIMAL(10,2) NOT NULL,  -- Lo que gana quien invita
    referred_reward DECIMAL(10,2) NOT NULL,  -- Lo que gana el invitado
    
    -- Estado de aplicación
    referrer_reward_applied BOOLEAN DEFAULT FALSE,
    referred_reward_applied BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    
    -- Validación: no puede referirse a sí mismo
    CONSTRAINT different_users CHECK (referrer_id != referred_id)
);

-- Índice para consultas por usuario
CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referred ON referral_rewards(referred_id);
