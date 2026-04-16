import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { action, session_id, session_data, set_data } = body

    if (action === 'start') {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          ...session_data,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ session: data })
    }

    if (action === 'complete') {
      const { error } = await supabase
        .from('workout_sessions')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          duration_minutes: set_data?.duration_minutes,
        })
        .eq('id', session_id)
        .eq('user_id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'log_set') {
      const { data, error } = await supabase
        .from('workout_sets')
        .insert({ user_id: user.id, session_id, ...set_data })
        .select()
        .single()

      if (error) throw error

      // Actualizar récord personal si aplica
      if (set_data.weight_kg) {
        await supabase
          .from('exercise_progress')
          .upsert({
            user_id: user.id,
            exercise_name: set_data.exercise_name,
            max_weight_kg: set_data.weight_kg,
            max_reps: set_data.reps_done,
            logged_at: new Date().toISOString().split('T')[0],
          })
      }

      return NextResponse.json({ set: data })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Workout session error:', error)
    return NextResponse.json({ error: 'Error guardando sesión' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // formato: 2026-04

    let query = supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)

    if (month) {
      query = query
        .gte('session_date', `${month}-01`)
        .lte('session_date', `${month}-31`)
    }

    const { data, error } = await query.order('session_date', { ascending: false })
    if (error) throw error

    return NextResponse.json({ sessions: data })
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo sesiones' }, { status: 500 })
  }
}
