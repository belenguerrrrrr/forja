import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { realtimeFeedback } from '@/lib/claude'

// POST — genera feedback en tiempo real basado en el estado del día
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const date = body.date || new Date().toISOString().split('T')[0]

    const [{ data: plan }, { data: userData }, { data: foods }, { data: log }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).single(),
      supabase.from('user_data').select('*').eq('user_id', user.id).single(),
      supabase.from('food_entries').select('calories, protein, carbs, fat').eq('user_id', user.id).eq('log_date', date),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', date).single(),
    ])

    const caloriesConsumed = (foods || []).reduce((s, f) => s + (f.calories || 0), 0)
    const proteinConsumed = (foods || []).reduce((s, f) => s + (parseFloat(f.protein) || 0), 0).toFixed(1)
    const carbsConsumed = (foods || []).reduce((s, f) => s + (parseFloat(f.carbs) || 0), 0).toFixed(1)
    const fatConsumed = (foods || []).reduce((s, f) => s + (parseFloat(f.fat) || 0), 0).toFixed(1)
    const hourOfDay = new Date().getHours()

    const feedback = await realtimeFeedback({
      goal: userData?.goal,
      daily_calories: plan?.daily_calories,
      protein_grams: plan?.protein_grams,
      carbs_grams: plan?.carbs_grams,
      fat_grams: plan?.fat_grams,
      caloriesConsumed,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
      workoutsToday: log?.calories_burned > 0 ? 'Sí' : 'No',
      currentWeight: log?.weight_morning || userData?.current_weight,
      targetWeight: userData?.target_weight,
      hourOfDay,
    })

    // Guardar feedback en daily_logs
    await supabase.from('daily_logs').upsert({
      user_id: user.id,
      log_date: date,
      ai_feedback_realtime: JSON.stringify(feedback),
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Error generando feedback' }, { status: 500 })
  }
}
