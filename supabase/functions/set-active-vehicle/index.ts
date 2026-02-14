// AgenciaRikera - Edge Function: set-active-vehicle
// Descripción: Activa un vehículo como el principal del conductor
// 
// Endpoint: POST /functions/v1/set-active-vehicle
// Body: { 
//   "user_id": "uuid",
//   "vehicle_id": "uuid"
// }
// Response: { 
//   "success": true, 
//   "message": "Vehículo activado correctamente"
// }
//
// Reglas:
// - Solo se puede activar un vehículo que esté APROBADO (status = 'approved')
// - Al activar un vehículo, todos los demás se desactivan automáticamente
// - Un conductor solo puede tener UN vehículo activo a la vez
//
// Flujo:
// 1. Valida que vengan user_id y vehicle_id
// 2. Verifica que el usuario tenga perfil de conductor
// 3. Llama a la función SQL set_active_vehicle()
// 4. La función verifica que el vehículo esté aprobado y pertenezca al conductor
// 5. Desactiva todos los vehículos del conductor
// 6. Activa el vehículo seleccionado
// 7. Retorna resultado

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
    const { user_id, vehicle_id } = await req.json()

    // Validar campos requeridos
    if (!user_id || !vehicle_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'user_id y vehicle_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear cliente Supabase con permisos de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar que el usuario tenga perfil de conductor
    const { data: driverProfile } = await supabaseAdmin
      .from('driver_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (!driverProfile) {
      return new Response(
        JSON.stringify({ success: false, message: 'No tienes perfil de conductor' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Llamar a la función SQL que activa el vehículo
    // Esta función verifica que el vehículo esté aprobado y pertenezca al conductor
    const { data: result } = await supabaseAdmin.rpc('set_active_vehicle', {
      p_vehicle_id: vehicle_id,
      p_driver_id: driverProfile.id
    })

    // Si retorna FALSE, el vehículo no existe, no está aprobado o no pertenece al conductor
    if (!result) {
      return new Response(
        JSON.stringify({ success: false, message: 'No se pudo activar. Verifica que el vehículo esté aprobado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Vehículo activado correctamente'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en set-active-vehicle:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
