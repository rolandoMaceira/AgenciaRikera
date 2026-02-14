// AgenciaRikera - Edge Function: update-profile
// Descripción: Actualiza datos del perfil del usuario después de verificar OTP
// 
// Endpoint: POST /functions/v1/update-profile
// Body: { 
//   "user_id": "uuid",
//   "first_name": "Juan",
//   "last_name": "Pérez",
//   "birth_date": "1990-05-15",
//   "gender": "Masculino",
//   "province": "La Habana",
//   "municipality": "Plaza de la Revolución"
// }
// Response: { 
//   "success": true, 
//   "message": "Perfil actualizado",
//   "profile": { ... }
// }
//
// Campos:
// - user_id: UUID del usuario (requerido)
// - first_name: Nombre (requerido)
// - last_name: Apellidos (requerido)
// - birth_date: Fecha de nacimiento YYYY-MM-DD (opcional)
// - gender: Masculino/Femenino (opcional)
// - province: Por defecto "La Habana" (opcional)
// - municipality: Municipio de La Habana (opcional)
//
// Nota: Esta función se llama después de verify-otp cuando la cuenta está activa

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
    const { user_id, first_name, last_name, birth_date, gender, province, municipality } = await req.json()

    // Validar campos requeridos
    if (!user_id || !first_name || !last_name) {
      return new Response(
        JSON.stringify({ success: false, message: 'user_id, nombre y apellidos son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con permisos de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Actualizar perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: first_name,
        last_name: last_name,
        full_name: `${first_name} ${last_name}`,
        birth_date: birth_date || null,
        gender: gender || null,
        province: province || 'La Habana',
        municipality: municipality || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single()

    if (profileError) {
      console.error('Error actualizando perfil:', profileError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al actualizar perfil' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Perfil actualizado',
        profile: profile
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en update-profile:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
