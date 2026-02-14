// AgenciaRikera - Edge Function: send-otp
// Descripción: Genera y guarda código OTP para verificación por SMS
// 
// Endpoint: POST /functions/v1/send-otp
// Body: { "phone": "+5355551234" }
// Response: { "success": true, "message": "OTP enviado" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Headers CORS para permitir peticiones desde la app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener el teléfono del body
    const { phone } = await req.json()

    // Validar que venga el teléfono
    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Teléfono requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar formato del teléfono (8-15 dígitos, puede empezar con +)
    const phoneRegex = /^\+?[0-9]{8,15}$/
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Formato de teléfono inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente de Supabase con service role (acceso total)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generar código OTP de 4 dígitos
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString()

    // Calcular expiración (10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidar OTPs anteriores del mismo teléfono (opcional pero recomendado)
    await supabaseAdmin
      .from('otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('phone', phone)
      .is('verified_at', null)

    // Guardar el nuevo OTP en la base de datos
    const { error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone: phone,
        code: otpCode,
        purpose: 'registration',
        expires_at: expiresAt
      })

    if (insertError) {
      console.error('Error insertando OTP:', insertError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al generar OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Aquí iría la integración con enTuMovil para enviar el SMS
    // Por ahora solo guardamos el código en la BD
    // 
    // Ejemplo futuro:
    // await sendSMS(phone, `Tu código de verificación es: ${otpCode}`)

    // En desarrollo, devolvemos el código para pruebas
    // EN PRODUCCIÓN QUITAR ESTO
    const isDevelopment = true
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP enviado',
        // Solo en desarrollo:
        ...(isDevelopment && { otp_code: otpCode })
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en send-otp:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
