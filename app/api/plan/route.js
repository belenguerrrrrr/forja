import { getUserFromRequest } from '@/lib/supabase/fromToken'
import { generatePlan } from '@/lib/claude'
import { sendWelcomeEmail } from '@/lib/resend'
import { NextResponse } from 'next/server'

// POST — generar y guardar plan
export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    console.log('API PLAN - user:', user?.id)

    // Leer datos del usuario desde Supabase
    const { data: userData, error: userError } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('API PLAN - userData:', userData)

    if (userError || !userData) {
      return NextResponse.json({ error: 'Datos de usuario no encontrados' }, { status: 404 })
    }

    // Desactivar plan anterior
    await supabase.from('plans').update({ is_active: false }).eq('user_id', user.id)

    console.log('API PLAN - generating...')

    // Generar plan con Claude
    const planData = await generatePlan(userData)

    console.log('API PLAN - plan generated:', !!planData)

    // Guardar plan en Supabase
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        health_score: planData.health_score,
        daily_calories: planData.daily_calories,
        protein_grams: planData.protein_grams,
        carbs_grams: planData.carbs_grams,
        fat_grams: planData.fat_grams,
        training_plan: planData.training_plan,
        summary: planData.summary,
        key_tips: planData.key_tips,
        is_active: true,
        version: 1,
      })
      .select()
      .single()

    console.log('API PLAN - saved:', plan?.id, planError?.message)

    if (planError) throw planError

    sendWelcomeEmail(user.email, user.user_metadata?.full_name, planData.summary).catch(console.error)

    return NextResponse.json({ success: true, plan })

  } catch (error) {
    console.error('Error generating plan:', error)
    return NextResponse.json(
      { error: 'Error al generar el plan. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}

// PATCH — actualizar training_plan del plan activo
export async function PATCH(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const { training_plan } = await request.json()
    if (!training_plan) return NextResponse.json({ error: 'training_plan requerido' }, { status: 400 })

    const { data: plan, error } = await supabase
      .from('plans')
      .update({ training_plan })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar el plan' }, { status: 500 })
  }
}

// GET — obtener plan activo del usuario
export async function GET(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return NextResponse.json({ plan: null })

    return NextResponse.json({ plan })

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
