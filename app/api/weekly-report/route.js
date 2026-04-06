import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWeeklyReport } from '@/lib/resend'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Calcular semana anterior
  const today = new Date()
  const dayOfWeek = today.getDay()
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() - dayOfWeek)
  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekEnd.getDate() - 6)

  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  // Obtener logs de la semana
  const [{ data: logs }, { data: weights }, { data: profile }, { data: plan }] = await Promise.all([
    supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', weekStartStr).lte('log_date', weekEndStr),
    supabase.from('weight_logs').select('*').eq('user_id', user.id).gte('logged_at', weekStartStr).lte('logged_at', weekEndStr).order('logged_at'),
    supabase.from('profiles').select('email, full_name').eq('id', user.id).single(),
    supabase.from('plans').select('daily_calories').eq('user_id', user.id).eq('is_active', true).single(),
  ])

  if (!logs?.length) {
    return NextResponse.json({ message: 'No hay datos para esta semana' })
  }

  const totalWorkouts = logs.filter(l => l.workout_done).length
  const avgCalories = Math.round(logs.reduce((s, l) => s + (l.calories_consumed || 0), 0) / logs.length)
  const adherence = Math.round((logs.length / 7) * 100)
  const weightChange = weights?.length >= 2
    ? parseFloat((weights[weights.length - 1].weight - weights[0].weight).toFixed(1))
    : 0

  // Generar texto del informe con Claude
  const reportPrompt = `Genera un informe semanal motivador y personalizado para un usuario de fitness.

Datos de la semana:
- Días con registro: ${logs.length}/7
- Entrenamientos completados: ${totalWorkouts}
- Media de calorías: ${avgCalories} kcal/día (objetivo: ${plan?.daily_calories || 'N/A'} kcal)
- Adherencia: ${adherence}%
- Cambio de peso: ${weightChange > 0 ? '+' : ''}${weightChange} kg

Escribe 3-4 frases: una valoración del rendimiento de la semana, un punto positivo específico, y motivación para la semana siguiente. Tono directo y energético.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: reportPrompt }],
  })

  const reportText = response.content[0].text

  // Generar logros
  const achievements = []
  if (totalWorkouts >= 5) achievements.push('🏆 Semana perfecta de entrenamiento')
  if (totalWorkouts >= 3) achievements.push('💪 Constancia en el gym')
  if (adherence >= 85) achievements.push('📊 Seguimiento excelente')
  if (Math.abs(avgCalories - (plan?.daily_calories || avgCalories)) < 100) achievements.push('🎯 Calorías en objetivo')
  if (weightChange < 0) achievements.push(`⚖️ ${Math.abs(weightChange)}kg menos esta semana`)

  // Guardar en BD
  const supabaseService = createServiceClient()
  const { data: report } = await supabaseService.from('weekly_reports').upsert({
    user_id: user.id,
    week_start: weekStartStr,
    week_end: weekEndStr,
    avg_daily_calories: avgCalories,
    total_workouts: totalWorkouts,
    weight_change: weightChange,
    adherence_percentage: adherence,
    report_text: reportText,
    achievements,
    next_week_focus: totalWorkouts < 3 ? 'Aumentar consistencia en entrenamientos' : 'Mantener el ritmo y optimizar nutrición',
    email_sent: false,
  }, { onConflict: 'user_id,week_start' }).select().single()

  // Enviar email
  if (profile?.email) {
    await sendWeeklyReport(profile.email, profile.full_name, {
      week_start: weekStartStr,
      total_workouts: totalWorkouts,
      adherence_percentage: adherence,
      weight_change: weightChange,
      report_text: reportText,
    })

    await supabaseService.from('weekly_reports').update({ email_sent: true }).eq('id', report.id)
  }

  return NextResponse.json({ report })
}
