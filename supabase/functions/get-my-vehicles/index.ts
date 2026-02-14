// AgenciaRikera - Edge Function: get-my-vehicles
// Descripción: Obtiene todos los vehículos de un conductor
// 
// Endpoint: POST /functions/v1/get-my-vehicles
// Body: { 
//   "user_id": "uuid"
// }
// Response: { 
//   "success": true, 
//   "vehicles": [
//     {
//       "id": "uuid",
//       "brand": "Toyota",
//       "model": "Corolla",
//       "year": 2020,
//       "color": "Blanco",
//       "plate_number": "P123456",
//       "is_active": true,
//       "status": "approved",
//       "vehicle_type_assignments": [
//         {
//           "status": "approved",
//           "vehicle_types": {
//             "id": "uuid",
//             "name": "Básico",
//             "description": "Auto económico"
//           }
//         }
//       ]
//     }
//   ]
// }
//
// Flujo:
// 1. Valida que venga el user_id
// 2. Verifica que el usuario tenga perfil de conductor
// 3. Obtiene todos los vehículos del conductor con sus tipos asignados
// 4. Retorna la lista ordenada por fecha de creación (más reciente primero)

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
    // Obtener user_id del body
    const { user_id } = await req.json()

    // Validar campo requerido
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'user_id es requerido' }),
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

    // Obtener vehículos con sus tipos asignados
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        *,
        vehicle_type_assignments (
          status,
          vehicle_types (
            id,
            name,
            description
          )
        )
      `)
      .eq('driver_id', driverProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener vehículos:', error)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al obtener vehículos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vehicles
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en get-my-vehicles:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
