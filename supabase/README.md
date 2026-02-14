# AgenciaRikera - Migraciones de Base de Datos

## Estructura de Archivos

```
supabase/migrations/
├── 001_initial_schema.sql      ← Tablas y tipos
├── 002_row_level_security.sql  ← Políticas RLS
├── 003_functions.sql           ← Funciones
├── 004_triggers.sql            ← Triggers
└── README.md                   ← Este archivo
```

---

## 001_initial_schema.sql

### Tipos Enumerados

| Tipo | Valores | Uso |
|------|---------|-----|
| `user_status` | pending_verification, active, suspended, banned | Estado de cuenta |
| `driver_verification_status` | not_started, pending_documents, pending_review, approved, rejected | Verificación de conductor |

### Tablas

#### `profiles` - Perfil de Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK, referencia a auth.users |
| phone | VARCHAR(20) | Teléfono único (+53XXXXXXXX) |
| phone_verified | BOOLEAN | ¿Teléfono verificado? |
| full_name | VARCHAR(100) | Nombre completo |
| email | VARCHAR(255) | Email opcional |
| avatar_url | TEXT | URL foto de perfil |
| is_passenger | BOOLEAN | ¿Es pasajero? (default: true) |
| is_driver | BOOLEAN | ¿Es conductor? (default: false) |
| referral_code | VARCHAR(10) | Mi código de referido (único, 8 chars) |
| referred_by_code | VARCHAR(10) | Código de quien me refirió |
| referred_by_user_id | UUID | FK a profiles |
| referral_count | INTEGER | Cuántos me usaron como referido |
| wallet_balance | DECIMAL(10,2) | Saldo en billetera |
| status | user_status | Estado de la cuenta |
| passenger_rating | DECIMAL(3,2) | Calificación como pasajero (1-5) |
| passenger_total_ratings | INTEGER | Total de calificaciones recibidas |
| language | VARCHAR(5) | Idioma preferido |
| notifications_enabled | BOOLEAN | ¿Notificaciones activas? |
| default_latitude | DECIMAL(10,8) | Ubicación por defecto |
| default_longitude | DECIMAL(11,8) | Ubicación por defecto |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última actualización |
| last_active_at | TIMESTAMPTZ | Última actividad |

#### `driver_profiles` - Datos de Conductor
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK a profiles (único) |
| verification_status | driver_verification_status | Estado de verificación |
| verified_at | TIMESTAMPTZ | Fecha de aprobación |
| license_number | VARCHAR(50) | Número de licencia |
| license_expiry | DATE | Vencimiento de licencia |
| license_photo_url | TEXT | Foto de licencia |
| identity_document_number | VARCHAR(50) | Número de documento |
| identity_document_photo_url | TEXT | Foto de documento |
| selfie_photo_url | TEXT | Selfie de verificación |
| driver_rating | DECIMAL(3,2) | Calificación como conductor |
| driver_total_ratings | INTEGER | Total de calificaciones |
| total_trips_completed | INTEGER | Viajes completados |
| total_earnings | DECIMAL(12,2) | Ganancias totales |
| driver_level | INTEGER | Nivel 1-5 |
| weekly_trips | INTEGER | Viajes esta semana |
| monthly_trips | INTEGER | Viajes este mes |
| commission_rate | DECIMAL(4,2) | % comisión (default: 15%) |
| is_online | BOOLEAN | ¿Está disponible? |
| current_latitude | DECIMAL(10,8) | Ubicación actual |
| current_longitude | DECIMAL(11,8) | Ubicación actual |
| last_location_update | TIMESTAMPTZ | Última actualización de ubicación |

#### `otp_codes` - Códigos de Verificación
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| phone | VARCHAR(20) | Teléfono destino |
| code | VARCHAR(6) | Código OTP (4-6 dígitos) |
| purpose | VARCHAR(20) | registration, login, password_reset |
| attempts | INTEGER | Intentos realizados |
| max_attempts | INTEGER | Máximo de intentos (3) |
| expires_at | TIMESTAMPTZ | Fecha de expiración |
| verified_at | TIMESTAMPTZ | Fecha de verificación |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### `referral_rewards` - Recompensas de Referidos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| referrer_id | UUID | FK a profiles (quien refirió) |
| referred_id | UUID | FK a profiles (quien fue referido) |
| referrer_reward | DECIMAL(10,2) | Recompensa para referidor |
| referred_reward | DECIMAL(10,2) | Recompensa para referido |
| referrer_reward_applied | BOOLEAN | ¿Ya se aplicó? |
| referred_reward_applied | BOOLEAN | ¿Ya se aplicó? |
| created_at | TIMESTAMPTZ | Fecha de creación |
| applied_at | TIMESTAMPTZ | Fecha de aplicación |

#### `user_sessions` - Sesiones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK a profiles |
| device_id | VARCHAR(255) | ID del dispositivo |
| device_type | VARCHAR(50) | ios, android, web |
| device_name | VARCHAR(100) | Nombre del dispositivo |
| app_version | VARCHAR(20) | Versión de la app |
| push_token | TEXT | Token para notificaciones push |
| ip_address | INET | IP del dispositivo |
| user_agent | TEXT | User agent |
| is_active | BOOLEAN | ¿Sesión activa? |
| last_activity_at | TIMESTAMPTZ | Última actividad |
| expires_at | TIMESTAMPTZ | Expiración de sesión |

---

## 002_row_level_security.sql

### Políticas por Tabla

#### profiles
| Política | Acción | Regla |
|----------|--------|-------|
| Users can view own profile | SELECT | auth.uid() = id |
| Users can update own profile | UPDATE | auth.uid() = id |
| Public profiles viewable | SELECT | status = 'active' (authenticated) |

#### driver_profiles
| Política | Acción | Regla |
|----------|--------|-------|
| Users can view own driver profile | SELECT | auth.uid() = user_id |
| Users can update own driver profile | UPDATE | auth.uid() = user_id |
| Users can insert own driver profile | INSERT | auth.uid() = user_id |
| Active drivers viewable | SELECT | verification_status = 'approved' AND is_online = TRUE |

#### user_sessions
| Política | Acción | Regla |
|----------|--------|-------|
| Users can view own sessions | SELECT | auth.uid() = user_id |
| Users can manage own sessions | ALL | auth.uid() = user_id |

#### referral_rewards
| Política | Acción | Regla |
|----------|--------|-------|
| Users can view own rewards | SELECT | auth.uid() = referrer_id OR auth.uid() = referred_id |

---

## 003_functions.sql

### Funciones Disponibles

#### `generate_referral_code()`
Genera código único de 8 caracteres alfanuméricos.

```sql
SELECT generate_referral_code();
-- Retorna: 'ABC123XY'
```

#### `verify_otp(phone, code, purpose)`
Verifica un código OTP.

```sql
SELECT * FROM verify_otp('+5355551234', '1234', 'registration');
-- Retorna: success (bool), message (text), user_id (uuid)
```

#### `apply_referral_rewards(referred_user_id, referrer_reward, referred_reward)`
Aplica recompensas de referido.

```sql
SELECT apply_referral_rewards('uuid-del-usuario', 50.00, 25.00);
-- Retorna: TRUE si se aplicó, FALSE si no tenía referidor
```

#### `cleanup_expired_otps()`
Elimina OTPs expirados (para cron job).

```sql
SELECT cleanup_expired_otps();
```

---

## 004_triggers.sql

### Triggers Activos

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| trigger_profiles_updated_at | profiles | BEFORE UPDATE | update_updated_at() |
| trigger_driver_profiles_updated_at | driver_profiles | BEFORE UPDATE | update_updated_at() |
| on_auth_user_created | auth.users | AFTER INSERT | handle_new_user() |

---

## Flujo de Registro

```
1. Usuario ingresa teléfono
        ↓
2. Backend crea OTP → INSERT en otp_codes
        ↓
3. Se envía SMS con código
        ↓
4. Usuario ingresa código
        ↓
5. SELECT verify_otp('+53...', '1234', 'registration')
        ↓
6. Si es válido → Se crea usuario en auth.users
        ↓
7. Trigger on_auth_user_created → Crea perfil automáticamente
        ↓
8. Usuario activo y listo
```

---

## Próximas Migraciones

- `005_vehicles.sql` - Tipos de vehículos y vehículos de conductores
- `006_trips.sql` - Sistema de viajes
- `007_payments.sql` - Pagos y transacciones
- `008_ratings.sql` - Calificaciones y reseñas
- `009_chat.sql` - Chat en tiempo real
- `010_notifications.sql` - Notificaciones push
