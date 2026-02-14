// ============================================
// AgenciaRikera - Edge Function: get-my-trips
// Descripción: Obtener historial de viajes del usuario
// ============================================
//
// Endpoint: POST /functions/v1/get-my-trips
//
// Body:
// {
//   "user_id": "uuid",
//   "role": "passenger" | "driver" (opcional),
//   "status": "completed" (opcional),
//   "limit": 20 (opcional, default 20)
// }
//
// Response:
// {
//   "success": true,
//   "trips": [
//     {
//       "id": "uuid",
//       "status": "completed",
//       "origin_address": "Calle 23, Vedado",
//       "destination_address": "Malecón, Habana",
//       "total_price": 800,
//       "vehicle_types": { "name": "Moto", "icon_url": null },
//       "trip_ratings": {
//         "driver_rating": 5,
//         "passenger_rating": 4,
//         "driver_comment": "Excelente",
//         "passenger_comment": "Buen pasajero"
//       }
//     }
//   ],
//   "count": 1
// }
//
// Filtros:
// - role: 'passenger' para ver viajes como pasajero, 'driver' para ver como conductor
// - status: filtrar por estado del viaje
// - limit: cantidad máxima de viajes a retornar
//
// Flujo:
// 1. Obtiene driver_profile si existe (para verificar si es conductor)
// 2. Construye la query según el rol especificado
// 3. Incluye el tipo de vehículo y las calificaciones
// 4. Ordena por fecha de creación (más reciente primero)
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
    const { user_id, role, status, limit = 20 } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'user_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener driver_profile si existe
    const { data: driverProfile } = await supabaseAdmin
      .from('driver_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single()

    let query = supabaseAdmin
      .from('trips')
      .select(`
        *,
        vehicle_types (name, icon_url),
        trip_ratings (driver_rating, passenger_rating, driver_comment, passenger_comment)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar por rol
    if (role === 'passenger') {
      query = query.eq('passenger_id', user_id)
    } else if (role === 'driver' && driverProfile) {
      query = query.eq('driver_id', driverProfile.id)
    } else {
      // Si no especifica rol, buscar ambos
      if (driverProfile) {
        query = query.or(`passenger_id.eq.${user_id},driver_id.eq.${driverProfile.id}`)
      } else {
        query = query.eq('passenger_id', user_id)
      }
    }

    // Filtrar por status si se especifica
    if (status) {
      query = query.eq('status', status)
    }

    const { data: trips, error } = await query

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Error al obtener viajes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        trips,
        count: trips.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en get-my-trips:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
