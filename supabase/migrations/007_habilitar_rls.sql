-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 007_habilitar_rls.sql
-- Descripción: Habilita Row Level Security en todas las tablas
-- Dependencias: 002-006 (todas las tablas)
-- ============================================

-- Row Level Security (RLS) restringe qué filas puede ver/modificar cada usuario
-- Es fundamental para la seguridad en Supabase
-- Sin RLS, cualquier usuario autenticado podría ver todos los datos

-- Habilitar RLS en tabla de perfiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla de conductores
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla de códigos OTP
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla de recompensas por referidos
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla de sesiones
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
