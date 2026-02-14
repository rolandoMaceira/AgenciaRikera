// ============================================
// AgenciaRikera - Edge Function: update-trip-status
// Descripción: Conductor actualiza el estado del viaje
// ============================================
//
// Endpoint: POST /functions/v1/update-trip-status
//
// Body:
// {
//   "trip_id": "uuid",
//   "driver_user_id": "uuid",
//   "new_status": "arrived" | "in_progress" | "completed"
// }
//
// Response:
// {
//   "success": true,
//   "message": "Has llegado al punto de recogida",
//   "trip": { ... }
// }
//
// Transiciones válidas:
// - accepted → arrived (conductor llegó al punto de recogida)
// - arrived → in_progress (pasajero subió, viaje iniciado)
// - in_progress → completed (viaje terminado)
//
// Reglas:
// - Solo el conductor asignado puede actualizar el estado
// - Al completar, el conductor queda on_trip = FALSE
// - Cada cambio registra el timestamp correspondiente
//
// Flujo:
// 1. Verifica que el conductor tenga driver_profile
// 2. Verifica que el viaje pertenezca a este conductor
// 3. Verifica que la transición sea válida
// 4. Actualiza el estado y el timestamp correspondiente
// 5. Si es 'completed', libera al conductor (on_trip = FALSE)
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
    const { trip_id, driver_user_id, new_status } = await req.json()

    if (!trip_id || !driver_user_id || !new_status) {
      return new Response(
        JSON.stringify({ success: false, message: 'trip_id, driver_user_id y new_status son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validTransitions = {
      'accepted': ['arrived'],
      'arrived': ['in_progress'],
      'in_progress': ['completed']
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
      .single()

    if (!trip) {
      return new Response(
        JSON.stringify({ success: false, message: 'Viaje no encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allowedStatuses = validTransitions[trip.status]
    if (!allowedStatuses || !allowedStatuses.includes(new_status)) {
      return new Response(
        JSON.stringify({ success: false, message: `No puedes cambiar de ${trip.status} a ${new_status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updateData: any = { status: new_status }
    
    if (new_status === 'arrived') {
      updateData.arrived_at = new Date().toISOString()
    } else if (new_status === 'in_progress') {
      updateData.started_at = new Date().toISOString()
    } else if (new_status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedTrip, error } = await supabaseAdmin
      .from('trips')
      .update(updateData)
      .eq('id', trip_id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Error al actualizar viaje' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Si el viaje se completó, liberar al conductor
    if (new_status === 'completed') {
      await supabaseAdmin
        .from('driver_profiles')
        .update({ on_trip: false })
        .eq('id', driverProfile.id)
    }

    const messages = {
      'arrived': 'Has llegado al punto de recogida',
      'in_progress': 'Viaje iniciado',
      'completed': 'Viaje completado'
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: messages[new_status],
        trip: updatedTrip
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en update-trip-status:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
