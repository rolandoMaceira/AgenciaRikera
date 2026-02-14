// ============================================
// AgenciaRikera - Edge Function: accept-trip
// Descripción: Conductor acepta un viaje asignado
// ============================================
//
// Endpoint: POST /functions/v1/accept-trip
//
// Body:
// {
//   "trip_id": "uuid",
//   "driver_user_id": "uuid"
// }
//
// Response:
// {
//   "success": true,
//   "message": "Viaje aceptado. Dirígete al punto de recogida.",
//   "trip": { ... }
// }
//
// Reglas:
// - Solo puede aceptar si el viaje está en status 'assigned'
// - Solo puede aceptar si el viaje está asignado a este conductor
// - Solo puede aceptar si no ha expirado el tiempo (assignment_expires_at)
// - Al aceptar, el conductor queda marcado como on_trip = TRUE
// - No recibirá más viajes hasta que complete o cancele
//
// Flujo:
// 1. Verifica que el conductor tenga driver_profile
// 2. Verifica que el viaje esté asignado a este conductor
// 3. Verifica que no haya expirado el tiempo
// 4. Actualiza el viaje a status 'accepted'
// 5. Marca al conductor como on_trip = TRUE
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trip_id, driver_user_id } = await req.json()

    if (!trip_id || !driver_user_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'trip_id y driver_user_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: driverProfile } = await supabaseAdmin
      .from('driver_profiles')
      .select('id')
      .eq('user_id', driver_user_id)
      .single()

    if (!driverProfile) {
      return new Response(
        JSON.stringify({ success: false, message: 'No tienes perfil de conductor' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .eq('driver_id', driverProfile.id)
      .eq('status', 'assigned')
      .single()

    if (!trip) {
      return new Response(
        JSON.stringify({ success: false, message: 'Viaje no encontrado o ya no está disponible' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(trip.assignment_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: 'El tiempo para aceptar ha expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Aceptar el viaje
    const { data: updatedTrip, error } = await supabaseAdmin
      .from('trips')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', trip_id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Error al aceptar viaje' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Marcar conductor en viaje
    await supabaseAdmin
      .from('driver_profiles')
      .update({ on_trip: true })
      .eq('id', driverProfile.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Viaje aceptado. Dirígete al punto de recogida.',
        trip: updatedTrip
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en accept-trip:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
