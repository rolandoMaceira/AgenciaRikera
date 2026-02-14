-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 014_funcion_apply_referral_rewards.sql
-- Descripción: Aplica recompensas por sistema de referidos
-- Dependencias: 002_tabla_profiles.sql, 005_tabla_referral_rewards.sql
-- ============================================

-- Aplica las recompensas cuando un usuario referido completa su primer viaje
-- Parámetros:
--   p_referred_user_id: ID del usuario que fue invitado
--   p_referrer_reward: Monto para quien invitó (default: $50)
--   p_referred_reward: Monto para el invitado (default: $25)
-- Retorna:
--   TRUE si se aplicaron las recompensas
--   FALSE si no había referrer

CREATE OR REPLACE FUNCTION apply_referral_rewards(
    p_referred_user_id UUID,
    p_referrer_reward DECIMAL DEFAULT 50.00,
    p_referred_reward DECIMAL DEFAULT 25.00
)
RETURNS BOOLEAN AS $$
DECLARE
    v_referrer_id UUID;
BEGIN
    -- Obtener el ID de quien invitó
    SELECT referred_by_user_id INTO v_referrer_id
    FROM profiles WHERE id = p_referred_user_id;
    
    -- Si no fue referido por nadie, salir
    IF v_referrer_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Crear registro de recompensa
    INSERT INTO referral_rewards (
        referrer_id, 
        referred_id, 
        referrer_reward, 
        referred_reward
    ) VALUES (
        v_referrer_id, 
        p_referred_user_id, 
        p_referrer_reward, 
        p_referred_reward
    );
    
    -- Agregar saldo a quien invitó
    UPDATE profiles 
    SET wallet_balance = wallet_balance + p_referrer_reward 
    WHERE id = v_referrer_id;
    
    -- Agregar saldo al invitado
    UPDATE profiles 
    SET wallet_balance = wallet_balance + p_referred_reward 
    WHERE id = p_referred_user_id;
    
    -- Marcar recompensas como aplicadas
    UPDATE referral_rewards 
    SET 
        referrer_reward_applied = TRUE, 
        referred_reward_applied = TRUE, 
        applied_at = NOW()
    WHERE referrer_id = v_referrer_id 
      AND referred_id = p_referred_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
