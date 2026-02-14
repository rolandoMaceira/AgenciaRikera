// AgenciaRikera - Edge Function: login
// Descripción: Inicia sesión con teléfono y contraseña
// 
// Endpoint: POST /functions/v1/login
// Body: { 
//   "phone": "+5355551234", 
//   "password": "123456"
// }
// Response: { 
//   "success": true, 
//   "message": "Login exitoso",
//   "user_id": "uuid",
//   "access_token": "jwt...",
//   "refresh_token": "token...",
//   "profile": { ... }
// }
//
// Flujo:
// 1. Valida teléfono y contraseña
// 2. Normaliza teléfono (quita el + si existe)
// 3. Intenta login con Supabase Auth
// 4. Verifica que la cuenta esté activa
// 5. Actualiza last_active_at
// 6. Retorna tokens y perfil completo
//
// Nota: El teléfono debe estar confirmado (phone_confirmed_at != null)
// Esto se hace automáticamente en verify-otp

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
    const { phone, password } = await req.json()

    // Validar campos requeridos
    if (!phone || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Teléfono y contraseña requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar teléfono (Supabase guarda sin el +)
    const normalizedPhone = phone.replace('+', '')

    // Crear cliente Supabase con permisos de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Intentar login con Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      phone: normalizedPhone,
      password: password
    })

    // Si hay error de autenticación
    if (authError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Teléfono o contraseña incorrectos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // Verificar que la cuenta esté activa
    if (profile?.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, message: 'Cuenta no verificada o suspendida' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Actualizar última actividad
    await supabaseAdmin
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', authData.user.id)

    // Retornar respuesta exitosa con tokens y perfil
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Login exitoso',
        user_id: authData.user.id,
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        profile: profile
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en login:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
