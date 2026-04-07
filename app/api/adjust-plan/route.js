import { getUserFromRequest } from '@/lib/supabase/fromToken'
import { generatePlanAdjustment } from '@/lib/claude'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const [{ data: plan }, { data: userData }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).single(),
      supabase.from('user_data').select('*').eq('user_id', user.id).single(),
    ])

    if (!plan || !userData) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const [{ data: logs }, { data: weights }] = await Promise.all([
      supabase.from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', twoWeeksAgo.toISOString().split('T')[0])
        .order('log_date'),
      supabase.from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', twoWeeksAgo.toISOString().split('T')[0])
        .order('logged_at'),
    ])

    const progressData = {
      days_logged:          logs?.length || 0,
      avg_calories:         logs?.length
        ? Math.round(logs.reduce((s, l) => s + (l.calories_consumed || 0), 0) / logs.length)
        : 0,
      workouts_completed:   logs?.filter(l => l.workout_done).length || 0,
      weight_start:         weights?.[0]?.weight,
      weight_end:           weights?.[weights.length - 1]?.weight,
      weight_change:        weights?.length >= 2
        ? weights[weights.length - 1].weight - weights[0].weight
        : null,
    }

    const adjustment = await generatePlanAdjustment(userData, progressData)

    const { error } = await supabase
      .from('plans')
      .update({
        daily_calories: adjustment.adjusted_calories || plan.daily_calories,
        protein_grams:  adjustment.adjusted_protein  || plan.protein_grams,
        carbs_grams:    adjustment.adjusted_carbs    || plan.carbs_grams,
        fat_grams:      adjustment.adjusted_fat      || plan.fat_grams,
        adjusted_reason: adjustment.reason,
        version:        (plan.version || 1) + 1,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', plan.id)

    if (error) throw error

    return NextResponse.json({ success: true, adjustment })

  } catch (error) {
    console.error('Adjust plan error:', error)
    return NextResponse.json({ error: 'Error ajustando plan' }, { status: 500 })
  }
}
