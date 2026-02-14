// AgenciaRikera - Edge Function: register-vehicle
// Descripción: Registra un vehículo nuevo para un conductor
// 
// Endpoint: POST /functions/v1/register-vehicle
// Body: { 
//   "user_id": "uuid",
//   "brand": "Toyota",
//   "model": "Corolla",
//   "year": 2020,
//   "color": "Blanco",
//   "plate_number": "P123456",
//   "vehicle_type_id": "uuid"
// }
// Response: { 
//   "success": true, 
//   "message": "Vehículo registrado. Pendiente de aprobación.",
//   "vehicle": { ... }
// }
//
// Flujo:
// 1. Valida que todos los campos estén presentes
// 2. Verifica que el usuario tenga perfil de conductor
// 3. Verifica que la placa no esté registrada
// 4. Crea el vehículo con status = 'pending_review'
// 5. Asigna el tipo de vehículo:
//    - Si requiere aprobación (Confort, Mini Van) → status = 'pending'
//    - Si no requiere (Moto, Básico) → status = 'approved'
// 6. Retorna el vehículo creado

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
    const { user_id, brand, model, year, color, plate_number, vehicle_type_id } = await req.json()

    // Validar campos requeridos
    if (!user_id || !brand || !model || !year || !color || !plate_number || !vehicle_type_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Todos los campos son requeridos' }),
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

    // Verificar que la placa no esté registrada
    const { data: existingPlate } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('plate_number', plate_number)
      .single()

    if (existingPlate) {
      return new Response(
        JSON.stringify({ success: false, message: 'Esta placa ya está registrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear el vehículo
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .insert({
        driver_id: driverProfile.id,
        brand,
        model,
        year,
        color,
        plate_number,
        status: 'pending_review'
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('Error al registrar vehículo:', vehicleError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error al registrar vehículo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar si el tipo de vehículo requiere aprobación
    const { data: vehicleType } = await supabaseAdmin
      .from('vehicle_types')
      .select('requires_approval')
      .eq('id', vehicle_type_id)
      .single()

    // Determinar el status de la asignación
    const assignmentStatus = vehicleType?.requires_approval ? 'pending' : 'approved'

    // Crear la asignación vehículo-tipo
    await supabaseAdmin
      .from('vehicle_type_assignments')
      .insert({
        vehicle_id: vehicle.id,
        vehicle_type_id,
        status: assignmentStatus
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Vehículo registrado. Pendiente de aprobación.',
        vehicle
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en register-vehicle:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
