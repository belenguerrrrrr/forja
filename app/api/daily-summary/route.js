import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateDailySummary } from '@/lib/claude'

// POST — genera el resumen nocturno del día completo
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const date = body.date || new Date().toISOString().split('T')[0]

    const [{ data: plan }, { data: userData }, { data: foods }, { data: log }, { data: workouts }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).single(),
      supabase.from('user_data').select('*').eq('user_id', user.id).single(),
      supabase.from('food_entries').select('calories, protein, carbs, fat').eq('user_id', user.id).eq('log_date', date),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', date).single(),
      supabase.from('workout_entries').select('*').eq('user_id', user.id).eq('log_date', date),
    ])

    const caloriesConsumed = (foods || []).reduce((s, f) => s + (f.calories || 0), 0)
    const proteinConsumed = (foods || []).reduce((s, f) => s + (parseFloat(f.protein) || 0), 0).toFixed(1)
    const carbsConsumed = (foods || []).reduce((s, f) => s + (parseFloat(f.carbs) || 0), 0).toFixed(1)
    const fatConsumed = (foods || []).reduce((s, f) => s + (parseFloat(f.fat) || 0), 0).toFixed(1)
    const totalCaloriesBurned = (workouts || []).reduce((s, w) => s + (w.calories_burned || 0), 0)

    const summary = await generateDailySummary({
      goal: userData?.goal,
      daily_calories: plan?.daily_calories,
      protein_grams: plan?.protein_grams,
      carbs_grams: plan?.carbs_grams,
      fat_grams: plan?.fat_grams,
      caloriesConsumed,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
      workouts: workouts || [],
      totalCaloriesBurned,
      sleepHours: log?.sleep_hours,
      sleepQuality: log?.sleep_quality,
      weightMorning: log?.weight_morning,
      targetWeight: userData?.target_weight,
      currentWeight: userData?.current_weight,
    })

    // Guardar resumen en daily_logs
    await supabase.from('daily_logs').upsert({
      user_id: user.id,
      log_date: date,
      ai_summary_night: summary.summary,
      summary_generated_at: new Date().toISOString(),
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Daily summary error:', error)
    return NextResponse.json({ error: 'Error generando resumen' }, { status: 500 })
  }
}
