import { getUserFromRequest } from '@/lib/supabase/fromToken'
import { coachChat } from '@/lib/claude'
import { NextResponse } from 'next/server'

// POST — enviar mensaje al coach
export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    // Verificar plan Pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!['pro_monthly', 'pro_annual', 'lifetime'].includes(profile?.plan)) {
      return NextResponse.json({ error: 'Requiere plan Pro' }, { status: 403 })
    }

    const { message } = await request.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
    }

    // Guardar mensaje del usuario
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message,
    })

    // Obtener historial (últimos 20 mensajes para contexto)
    const { data: history } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const messages = (history || []).reverse()

    // Obtener contexto del usuario
    const [{ data: plan }, { data: userData }, { data: recentLogs }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).single(),
      supabase.from('user_data').select('*').eq('user_id', user.id).single(),
      supabase.from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(7),
    ])

    const workoutsThisWeek  = recentLogs?.filter(l => l.workout_done).length || 0
    const logsWithData      = recentLogs?.filter(l => l.calories_consumed > 0).length || 0
    const adherence         = recentLogs?.length
      ? Math.round((logsWithData / recentLogs.length) * 100)
      : 0

    const userContext = {
      goal:                userData?.goal,
      current_weight:      userData?.current_weight,
      target_weight:       userData?.target_weight,
      daily_calories:      plan?.daily_calories,
      protein_grams:       plan?.protein_grams,
      carbs_grams:         plan?.carbs_grams,
      fat_grams:           plan?.fat_grams,
      workouts_this_week:  workoutsThisWeek,
      last_week_adherence: adherence,
    }

    const response = await coachChat(messages, userContext)

    // Guardar respuesta del asistente
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: response,
    })

    return NextResponse.json({ message: response })

  } catch (error) {
    console.error('Coach error:', error)
    return NextResponse.json({ error: 'Error del coach. Inténtalo de nuevo.' }, { status: 500 })
  }
}

// GET — obtener historial de mensajes
export async function GET(request) {
  try {
    const { supabase, user, error: authError } = await getUserFromRequest(request)
    if (authError) return authError

    const { data: messages } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100)

    return NextResponse.json({ messages: messages || [] })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
