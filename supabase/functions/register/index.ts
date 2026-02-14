// AgenciaRikera - Edge Function: register
// Descripción: Registra nuevo usuario con teléfono y contraseña
// 
// Endpoint: POST /functions/v1/register
// Body: { 
//   "phone": "+5355551234", 
//   "password": "123456",
//   "referred_by_code": "ABC123XY" (opcional)
// }
// Response: { 
//   "success": true, 
//   "message": "Usuario creado. Verifica tu teléfono.",
//   "user_id": "uuid",
//   "referral_code": "XYZ789AB",
//   "otp_code": "1234" (solo en desarrollo)
// }
//
// Flujo:
// 1. Valida teléfono y contraseña
// 2. Verifica que el teléfono no esté registrado
// 3. Crea usuario en auth.users
// 4. Genera código de referido único
// 5. Crea perfil en profiles
// 6. Si hay código de referido, vincula con referrer
// 7. Genera OTP y lo guarda
// 8. Retorna datos del usuario

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener datos del body
    const { phone, password, referred_by_code } = await req.json()

    // Validar campos requeridos
    if (!phone || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Teléfono y contraseña requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar formato de teléfono
    const phoneRegex = /^\+?[0-9]{8,15}$/
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Formato de teléfono inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con permisos de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar si el teléfono ya está registrado
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ success: false, message: 'Este teléfono ya está registrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: phone,
      password: password,
      phone_confirm: false,
      user_metadata: {
        referred_by_code: referred_by_code || null
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Error al crear usuario: ' + authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user?.id

    // Generar código de referido único (8 caracteres)
    let referralCode = ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    for (let i = 0; i < 8; i++) {
      referralCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Buscar referrer si se proporcionó código
    let referrerUserId = null
    if (referred_by_code) {
      const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', referred_by_code)
        .single()
      
      if (referrer) {
        referrerUserId = referrer.id
      }
    }

    // Crear perfil del usuario
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        phone: phone,
        referral_code: referralCode,
        referred_by_code: referred_by_code || null,
        referred_by_user_id: referrerUserId,
        status: 'pending_verification'
      })

    // Si falla la creación del perfil, eliminar el usuario de auth
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al crear perfil' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Actualizar contador de referidos del referrer
    if (referrerUserId) {
      await supabaseAdmin
        .from('profiles')
        .update({ referral_count: supabaseAdmin.rpc('increment', { x: 1 }) })
        .eq('id', referrerUserId)
    }

    // Generar código OTP (4 dígitos)
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos

    // Guardar OTP en la base de datos
    await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone: phone,
        code: otpCode,
        purpose: 'registration',
        expires_at: expiresAt
      })

    // TODO: Aquí iría la integración con enTuMovil para enviar SMS
    // await sendSMS(phone, `Tu código de verificación es: ${otpCode}`)

    // En desarrollo, devolvemos el OTP para pruebas
    const isDevelopment = true

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario creado. Verifica tu teléfono.',
        user_id: userId,
        referral_code: referralCode,
        ...(isDevelopment && { otp_code: otpCode })
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en register:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
