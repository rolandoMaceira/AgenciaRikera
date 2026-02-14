// ============================================
// AgenciaRikera - Edge Function: cancel-trip
// Descripción: Cancelar un viaje (pasajero o conductor)
// ============================================
//
// Endpoint: POST /functions/v1/cancel-trip
//
// Body:
// {
//   "trip_id": "uuid",
//   "user_id": "uuid",
//   "reason": "Cambié de opinión" (opcional)
// }
//
// Response:
// {
//   "success": true,
//   "message": "Viaje cancelado",
//   "trip": { ... },
//   "cancelled_by": "passenger" | "driver"
// }
//
// Reglas:
// - Solo el pasajero o el conductor asignado pueden cancelar
// - Solo se puede cancelar en estados: pending, assigned, accepted, arrived
// - NO se puede cancelar un viaje en in_progress o completed
// - Al cancelar, el conductor queda on_trip = FALSE
//
// Flujo:
// 1. Verifica que el viaje exista
// 2. Verifica que el viaje se pueda cancelar (status válido)
// 3. Verifica que el usuario sea pasajero o conductor del viaje
// 4. Actualiza el viaje a status 'cancelled'
// 5. Libera al conductor si había uno asignado (on_trip = FALSE)
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
    const { trip_id, user_id, reason } = await req.json()

    if (!trip_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'trip_id y user_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener el viaje
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .single()

    if (!trip) {
      return new Response(
        JSON.stringify({ success: false, message: 'Viaje no encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el viaje se pueda cancelar
    const cancelableStatuses = ['pending', 'assigned', 'accepted', 'arrived']
    if (!cancelableStatuses.includes(trip.status)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Este viaje no se puede cancelar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el usuario sea el pasajero o el conductor
    const { data: driverProfile } = await supabaseAdmin
      .from('driver_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single()

    const isPassenger = trip.passenger_id === user_id
    const isDriver = driverProfile && trip.driver_id === driverProfile.id

    if (!isPassenger && !isDriver) {
      return new Response(
        JSON.stringify({ success: false, message: 'No tienes permiso para cancelar este viaje' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cancelar el viaje
    const { data: updatedTrip, error } = await supabaseAdmin
      .from('trips')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user_id,
        cancellation_reason: reason || null
      })
      .eq('id', trip_id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Error al cancelar viaje' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Liberar al conductor si había uno asignado
    if (trip.driver_id) {
      await supabaseAdmin
        .from('driver_profiles')
        .update({ on_trip: false })
        .eq('id', trip.driver_id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Viaje cancelado',
        trip: updatedTrip,
        cancelled_by: isPassenger ? 'passenger' : 'driver'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en cancel-trip:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
