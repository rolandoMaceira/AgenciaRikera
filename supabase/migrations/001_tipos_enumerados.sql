-- ============================================
-- AgenciaRikera - App de Taxis
-- Migración: 001_tipos_enumerados.sql
-- Descripción: Define los tipos ENUM para estados
-- ============================================

-- Estado del usuario en la plataforma
-- pending_verification: Acaba de registrarse, esperando verificar OTP
-- active: Cuenta verificada y activa
-- suspended: Suspendido temporalmente (puede ser reactivado)
-- banned: Baneado permanentemente
CREATE TYPE user_status AS ENUM (
    'pending_verification',
    'active',
    'suspended',
    'banned'
);

-- Estado de verificación del conductor
-- not_started: No ha iniciado el proceso
-- pending_documents: Falta subir documentos
-- pending_review: Documentos enviados, esperando revisión
-- approved: Aprobado para conducir
-- rejected: Rechazado (puede volver a intentar)
CREATE TYPE driver_verification_status AS ENUM (
    'not_started',
    'pending_documents',
    'pending_review',
    'approved',
    'rejected'
);
