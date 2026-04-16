import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const [{ data: plan }, { data: userData }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
      supabase.from('user_data').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Genera un plan de comidas semanal completo y detallado para esta persona.

DATOS:
- Objetivo: ${userData?.goal}
- Calorías diarias objetivo: ${plan?.daily_calories} kcal
- Proteína: ${plan?.protein_grams}g | Carbos: ${plan?.carbs_grams}g | Grasas: ${plan?.fat_grams}g
- Restricciones: ${userData?.dietary_restrictions?.join(', ') || 'ninguna'}
- Peso actual: ${userData?.current_weight}kg

Devuelve ÚNICAMENTE un JSON válido con esta estructura para los 7 días:
{
  "monday": {
    "breakfast": { "name": "nombre", "description": "descripción", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "prep_time": "10 min" },
    "morning_snack": { ... },
    "lunch": { ... },
    "afternoon_snack": { ... },
    "dinner": { ... },
    "total_calories": 0
  },
  "tuesday": { ... },
  "wednesday": { ... },
  "thursday": { ... },
  "friday": { ... },
  "saturday": { ... },
  "sunday": { ... }
}

Asegúrate de que los totales diarios se acerquen al objetivo calórico. Usa alimentos comunes en España.`
      }],
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const mealPlan = JSON.parse(jsonMatch[0])
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    await supabase.from('meal_plans').upsert({
      user_id: user.id,
      week_start: weekStartStr,
      plan_data: mealPlan,
    })

    return NextResponse.json({ meal_plan: mealPlan, week_start: weekStartStr })

  } catch (error) {
    console.error('Meal plan error:', error)
    return NextResponse.json({ error: 'Error generando plan de comidas' }, { status: 500 })
  }
}
