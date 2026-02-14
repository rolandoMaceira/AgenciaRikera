-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 010_politicas_sessions_rewards.sql
-- Descripción: Políticas RLS para user_sessions y referral_rewards
-- Dependencias: 007_habilitar_rls.sql
-- ============================================

-- ============================================
-- POLÍTICAS: user_sessions
-- ============================================

-- Política: Usuario puede ver sus propias sesiones
-- Para listar dispositivos conectados
CREATE POLICY "Users can view own sessions"
    ON user_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Usuario puede gestionar sus propias sesiones
-- Incluye INSERT, UPDATE, DELETE
-- Para registrar nuevo dispositivo o cerrar sesión
CREATE POLICY "Users can manage own sessions"
    ON user_sessions FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS: referral_rewards
-- ============================================

-- Política: Usuario puede ver recompensas donde participó
-- Ya sea como referrer (quien invitó) o referred (invitado)
CREATE POLICY "Users can view own rewards"
    ON referral_rewards FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
