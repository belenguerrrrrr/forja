import { getUserFromRequest } from '@/lib/supabase/fromToken'
import { NextResponse } from 'next/server'

// POST — guardar entrada de alimento o entrenamiento
export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const body = await request.json()
    const { type, date, ...data } = body
    const logDate = date || new Date().toISOString().split('T')[0]

    if (type === 'food') {
      const { data: entry, error } = await supabase
        .from('food_entries')
        .insert({ user_id: user.id, log_date: logDate, ...data })
        .select()
        .single()

      if (error) throw error

      await recalculateDayTotals(supabase, user.id, logDate)
      return NextResponse.json({ success: true, entry })
    }

    if (type === 'workout') {
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          log_date: logDate,
          workout_done: true,
          workout_type: data.workout_type,
          workout_duration_minutes: data.workout_duration_minutes,
          calories_burned: data.calories_burned || 0,
          workout_notes: data.notes || null,
        })

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (type === 'weight') {
      const { error } = await supabase
        .from('weight_logs')
        .upsert({ user_id: user.id, logged_at: logDate, weight: data.weight })

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })

  } catch (error) {
    console.error('Tracker error:', error)
    return NextResponse.json({ error: 'Error guardando datos' }, { status: 500 })
  }
}

// GET — obtener log del día
export async function GET(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const date  = searchParams.get('date')  || new Date().toISOString().split('T')[0]
    const range = searchParams.get('range')

    if (range === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [{ data: logs }, { data: weights }] = await Promise.all([
        supabase.from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', weekAgo.toISOString().split('T')[0])
          .order('log_date', { ascending: true }),
        supabase.from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', weekAgo.toISOString().split('T')[0])
          .order('logged_at', { ascending: true }),
      ])

      return NextResponse.json({ logs: logs || [], weights: weights || [] })
    }

    const [{ data: log }, { data: foods }] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', date).single(),
      supabase.from('food_entries').select('*').eq('user_id', user.id).eq('log_date', date).order('created_at'),
    ])

    return NextResponse.json({ log, foods: foods || [] })

  } catch {
    return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 })
  }
}

// DELETE — eliminar entrada de alimento
export async function DELETE(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const { id, date } = await request.json()

    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    await recalculateDayTotals(supabase, user.id, date)
    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: 'Error eliminando entrada' }, { status: 500 })
  }
}

// Helper
async function recalculateDayTotals(supabase, userId, date) {
  const { data: entries } = await supabase
    .from('food_entries')
    .select('calories, protein, carbs, fat')
    .eq('user_id', userId)
    .eq('log_date', date)

  const totals = (entries || []).reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein:  acc.protein  + (parseFloat(e.protein) || 0),
      carbs:    acc.carbs    + (parseFloat(e.carbs)   || 0),
      fat:      acc.fat      + (parseFloat(e.fat)     || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  await supabase.from('daily_logs').upsert({
    user_id:           userId,
    log_date:          date,
    calories_consumed: totals.calories,
    protein_consumed:  totals.protein,
    carbs_consumed:    totals.carbs,
    fat_consumed:      totals.fat,
  })
}
