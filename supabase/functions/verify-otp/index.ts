// AgenciaRikera - Edge Function: verify-otp
// Descripción: Verifica código OTP y activa la cuenta
// 
// Endpoint: POST /functions/v1/verify-otp
// Body: { 
//   "phone": "+5355551234", 
//   "code": "1234"
// }
// Response: { 
//   "success": true, 
//   "message": "Verificación exitosa",
//   "user_id": "uuid"
// }
//
// Flujo:
// 1. Valida teléfono y código
// 2. Llama a la función verify_otp de la BD
// 3. Si es válido:
//    - Marca el OTP como verificado
//    - Actualiza profiles.status = 'active'
//    - Actualiza profiles.phone_verified = true
//    - Confirma teléfono en auth.users (phone_confirmed_at)
// 4. Retorna resultado
//
// Importante: Este paso es necesario para que el login funcione

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
    // Obtener teléfono y código del body
    const { phone, code } = await req.json()

    // Validar campos requeridos
    if (!phone || !code) {
      return new Response(
        JSON.stringify({ success: false, message: 'Teléfono y código requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con permisos de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Llamar a la función verify_otp de la base de datos
    // Esta función verifica el código, marca el OTP como usado
    // y actualiza el perfil a status='active' y phone_verified=true
    const { data, error } = await supabaseAdmin.rpc('verify_otp', {
      p_phone: phone,
      p_code: code,
      p_purpose: 'registration'
    })

    if (error) {
      console.error('Error verificando OTP:', error)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al verificar OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // La función retorna un array con un objeto
    const result = data[0]

    // Si la verificación fue exitosa, confirmar teléfono en auth.users
    // Esto es NECESARIO para que el login con contraseña funcione
    if (result.success && result.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(result.user_id, {
        phone_confirm: true
      })
    }

    // Retornar resultado
    return new Response(
      JSON.stringify({ 
        success: result.success, 
        message: result.message,
        user_id: result.user_id
      }),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en verify-otp:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
