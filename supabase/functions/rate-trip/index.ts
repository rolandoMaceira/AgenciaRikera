// ============================================
// AgenciaRikera - Edge Function: rate-trip
// Descripción: Calificar un viaje completado
// ============================================
//
// Endpoint: POST /functions/v1/rate-trip
//
// Body:
// {
//   "trip_id": "uuid",
//   "user_id": "uuid",
//   "rating": 5,           // 1-5 estrellas
//   "comment": "Excelente" // opcional
// }
//
// Response:
// {
//   "success": true,
//   "message": "Calificación registrada",
//   "rated_as": "passenger" | "driver"
// }
//
// Reglas:
// - Solo se puede calificar viajes completados
// - Solo el pasajero o el conductor del viaje pueden calificar
// - Cada uno puede calificar solo una vez
// - Rating debe ser entre 1 y 5
// - El pasajero califica al conductor (driver_rating)
// - El conductor califica al pasajero (passenger_rating)
// - Se actualiza el promedio de rating del usuario calificado
//
// Flujo:
// 1. Verifica que el viaje esté completado
// 2. Determina si el usuario es pasajero o conductor
// 3. Verifica que no haya calificado ya
// 4. Crea o actualiza el registro en trip_ratings
// 5. Recalcula el promedio de rating del usuario calificado
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
    const { trip_id, user_id, rating, comment } = await req.json()

    if (!trip_id || !user_id || !rating) {
      return new Response(
        JSON.stringify({ success: false, message: 'trip_id, user_id y rating son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ success: false, message: 'Rating debe ser entre 1 y 5' }),
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
      .eq('status', 'completed')
      .single()

    if (!trip) {
      return new Response(
        JSON.stringify({ success: false, message: 'Viaje no encontrado o no completado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determinar si es pasajero o conductor
    const { data: driverProfile } = await supabaseAdmin
      .from('driver_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single()

    const isPassenger = trip.passenger_id === user_id
    const isDriver = driverProfile && trip.driver_id === driverProfile.id

    if (!isPassenger && !isDriver) {
      return new Response(
        JSON.stringify({ success: false, message: 'No tienes permiso para calificar este viaje' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar si ya existe un rating para este viaje
    const { data: existingRating } = await supabaseAdmin
      .from('trip_ratings')
      .select('*')
      .eq('trip_id', trip_id)
      .single()

    if (existingRating) {
      // Actualizar rating existente
      const updateData: any = {}
      
      if (isPassenger) {
        if (existingRating.driver_rating) {
          return new Response(
            JSON.stringify({ success: false, message: 'Ya calificaste este viaje' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        updateData.driver_rating = rating
        updateData.driver_comment = comment || null
        updateData.driver_rated_at = new Date().toISOString()
      } else {
        if (existingRating.passenger_rating) {
          return new Response(
            JSON.stringify({ success: false, message: 'Ya calificaste este viaje' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        updateData.passenger_rating = rating
        updateData.passenger_comment = comment || null
        updateData.passenger_rated_at = new Date().toISOString()
      }

      await supabaseAdmin
        .from('trip_ratings')
        .update(updateData)
        .eq('trip_id', trip_id)

    } else {
      // Crear nuevo rating
      const insertData: any = { trip_id }
      
      if (isPassenger) {
        insertData.driver_rating = rating
        insertData.driver_comment = comment || null
        insertData.driver_rated_at = new Date().toISOString()
      } else {
        insertData.passenger_rating = rating
        insertData.passenger_comment = comment || null
        insertData.passenger_rated_at = new Date().toISOString()
      }

      await supabaseAdmin
        .from('trip_ratings')
        .insert(insertData)
    }

    // Actualizar promedio de rating de forma simple
    if (isPassenger && trip.driver_id) {
      // Obtener todos los viajes del conductor
      const { data: driverTrips } = await supabaseAdmin
        .from('trips')
        .select('id')
        .eq('driver_id', trip.driver_id)
        .eq('status', 'completed')

      if (driverTrips) {
        const tripIds = driverTrips.map(t => t.id)
        
        const { data: ratings } = await supabaseAdmin
          .from('trip_ratings')
          .select('driver_rating')
          .in('trip_id', tripIds)
          .not('driver_rating', 'is', null)

        if (ratings && ratings.length > 0) {
          const avgRating = ratings.reduce((sum, r) => sum + r.driver_rating, 0) / ratings.length
          await supabaseAdmin
            .from('driver_profiles')
            .update({ 
              driver_rating: Math.round(avgRating * 100) / 100,
              driver_total_ratings: ratings.length
            })
            .eq('id', trip.driver_id)
        }
      }
    } else if (isDriver) {
      // Obtener todos los viajes del pasajero
      const { data: passengerTrips } = await supabaseAdmin
        .from('trips')
        .select('id')
        .eq('passenger_id', trip.passenger_id)
        .eq('status', 'completed')

      if (passengerTrips) {
        const tripIds = passengerTrips.map(t => t.id)
        
        const { data: ratings } = await supabaseAdmin
          .from('trip_ratings')
          .select('passenger_rating')
          .in('trip_id', tripIds)
          .not('passenger_rating', 'is', null)

        if (ratings && ratings.length > 0) {
          const avgRating = ratings.reduce((sum, r) => sum + r.passenger_rating, 0) / ratings.length
          await supabaseAdmin
            .from('profiles')
            .update({ 
              passenger_rating: Math.round(avgRating * 100) / 100,
              passenger_total_ratings: ratings.length
            })
            .eq('id', trip.passenger_id)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calificación registrada',
        rated_as: isPassenger ? 'passenger' : 'driver'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en rate-trip:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
