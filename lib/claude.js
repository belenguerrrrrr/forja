import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-sonnet-4-6'

/**
 * Genera el plan inicial del usuario
 */
export async function generatePlan(userData) {
  const {
    goal, goal_description, target_weight, target_date,
    current_weight, height, age, gender,
    activity_level, training_days_per_week, training_duration_minutes,
    gym_access, injuries, dietary_restrictions,
  } = userData

  const prompt = `Eres FORJA, un coach de fitness y nutrición de élite. Analiza estos datos y genera un plan completamente personalizado.

DATOS DEL USUARIO:
- Objetivo: ${goal}${goal_description ? ` (${goal_description})` : ''}
- Peso actual: ${current_weight}kg | Altura: ${height}cm | Edad: ${age} años | Género: ${gender}
- Peso objetivo: ${target_weight ? `${target_weight}kg` : 'No especificado'}
- Fecha límite: ${target_date || 'Sin plazo concreto'}
- Nivel de actividad actual: ${activity_level}
- Días disponibles para entrenar: ${training_days_per_week} días/semana
- Duración por sesión: ${training_duration_minutes} minutos
- Acceso a gimnasio: ${gym_access ? 'Sí' : 'No, entrena en casa'}
- Lesiones o limitaciones: ${injuries?.length ? injuries.join(', ') : 'Ninguna'}
- Restricciones dietéticas: ${dietary_restrictions?.length ? dietary_restrictions.join(', ') : 'Ninguna'}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "health_score": <número 1-100 basado en estado físico actual>,
  "daily_calories": <kcal diarias objetivo como número entero>,
  "protein_grams": <gramos de proteína diarios>,
  "carbs_grams": <gramos de carbohidratos diarios>,
  "fat_grams": <gramos de grasa diarios>,
  "training_plan": {
    "monday": {
      "type": "<tipo de sesión o 'rest'>",
      "name": "<nombre de la sesión>",
      "duration_minutes": <duración>,
      "exercises": [
        {
          "name": "<nombre ejercicio>",
          "sets": <series>,
          "reps": "<repeticiones o duración>",
          "rest_seconds": <descanso>,
          "notes": "<nota técnica opcional>"
        }
      ],
      "cardio": "<descripción cardio si aplica, o null>"
    },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": { ... },
    "sunday": { ... }
  },
  "summary": "<resumen personalizado motivador de 3-4 frases que explica el plan y por qué funcionará para esta persona específica>",
  "key_tips": [
    "<consejo clave 1>",
    "<consejo clave 2>",
    "<consejo clave 3>"
  ]
}

Asegúrate de que el plan de entrenamiento respete los días disponibles (${training_days_per_week} días) y las limitaciones indicadas.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}

/**
 * Respuesta del AI Coach con contexto completo
 */
export async function coachChat(messages, userContext) {
  const systemPrompt = `Eres FORJA Coach, un coach de fitness y nutrición de élite con personalidad directa, motivadora y empática. 
  
CONTEXTO DEL USUARIO:
- Objetivo: ${userContext.goal}
- Peso actual: ${userContext.current_weight}kg → Objetivo: ${userContext.target_weight || 'no especificado'}kg
- Plan calórico: ${userContext.daily_calories} kcal/día
- Macros: ${userContext.protein_grams}g proteína | ${userContext.carbs_grams}g carbos | ${userContext.fat_grams}g grasa
- Días entrenando esta semana: ${userContext.workouts_this_week || 0}
- Adherencia última semana: ${userContext.last_week_adherence || 'N/A'}%

Responde siempre en español. Sé conciso, directo y útil. Usa emojis con moderación. 
Si el usuario pregunta algo fuera de fitness/nutrición, redirígelo amablemente.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  return response.content[0].text
}

/**
 * Feedback en tiempo real durante el día
 */
export async function realtimeFeedback(context) {
  const {
    goal, daily_calories, protein_grams, carbs_grams, fat_grams,
    caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed,
    workoutsToday, currentWeight, targetWeight, hourOfDay,
  } = context

  const caloriesRemaining = (daily_calories || 0) - (caloriesConsumed || 0)

  const prompt = `Eres FORJA Coach. Analiza el estado del día y da feedback práctico y motivador.

OBJETIVO DEL USUARIO: ${goal || 'no especificado'}
PLAN CALÓRICO: ${daily_calories} kcal/día | P:${protein_grams}g C:${carbs_grams}g G:${fat_grams}g
HORA ACTUAL: ${hourOfDay}:00h

CONSUMIDO HASTA AHORA:
- Calorías: ${caloriesConsumed} kcal (${caloriesRemaining > 0 ? caloriesRemaining + ' restantes' : Math.abs(caloriesRemaining) + ' por encima'})
- Proteína: ${proteinConsumed}g / ${protein_grams}g objetivo
- Carbos: ${carbsConsumed}g / ${carbs_grams}g objetivo
- Grasas: ${fatConsumed}g / ${fat_grams}g objetivo

ENTRENAMIENTOS HOY: ${workoutsToday}
PESO ACTUAL: ${currentWeight || 'no registrado'} kg | OBJETIVO: ${targetWeight || 'no especificado'} kg

Responde ÚNICAMENTE con JSON válido:
{
  "status": "excellent|good|ok|attention",
  "message": "<feedback directo en 2-3 frases sobre cómo va el día>",
  "nextMealSuggestion": "<qué comer en la próxima comida con cantidades aproximadas>",
  "motivation": "<frase motivadora corta>"
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}

/**
 * Resumen nocturno del día completo
 */
export async function generateDailySummary(context) {
  const {
    goal, daily_calories, protein_grams, carbs_grams, fat_grams,
    caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed,
    workouts, totalCaloriesBurned,
    sleepHours, sleepQuality, weightMorning, targetWeight, currentWeight,
  } = context

  const adherencePct = daily_calories > 0
    ? Math.round((caloriesConsumed / daily_calories) * 100)
    : 0

  const prompt = `Eres FORJA Coach. Genera el resumen nocturno del día.

OBJETIVO: ${goal || 'no especificado'}
PLAN: ${daily_calories} kcal/día | P:${protein_grams}g C:${carbs_grams}g G:${fat_grams}g

REGISTRO COMPLETO DEL DÍA:
- Calorías consumidas: ${caloriesConsumed} kcal (${adherencePct}% del objetivo)
- Proteína: ${proteinConsumed}g / ${protein_grams}g objetivo
- Carbos: ${carbsConsumed}g / ${carbs_grams}g objetivo
- Grasas: ${fatConsumed}g / ${fat_grams}g objetivo
- Entrenamientos: ${workouts?.length || 0} sesión(es), ${totalCaloriesBurned} kcal quemadas
- Sueño: ${sleepHours || 'no registrado'} horas, calidad ${sleepQuality ? sleepQuality + '/5' : 'no registrada'}
- Peso esta mañana: ${weightMorning || 'no registrado'} kg
- Peso objetivo: ${targetWeight || 'no especificado'} kg

Responde ÚNICAMENTE con JSON válido:
{
  "score": <número entero 1-10>,
  "achievements": ["<logro concreto 1>", "<logro concreto 2>"],
  "improvements": ["<mejora específica para mañana 1>", "<mejora específica para mañana 2>"],
  "calorieAdjustment": <0 si está bien, número positivo para subir kcal, negativo para bajar>,
  "summary": "<resumen del día en 3-4 frases, honesto y motivador>"
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}

/**
 * Genera ajuste del plan si no hay progreso
 */
export async function generatePlanAdjustment(userData, progressData) {
  const prompt = `El usuario no está progresando según lo esperado. Analiza y sugiere ajustes concretos.

DATOS ORIGINALES: ${JSON.stringify(userData)}
PROGRESO ÚLTIMAS 2 SEMANAS: ${JSON.stringify(progressData)}

Responde con JSON: { "adjusted_calories": <número>, "adjusted_protein": <número>, "adjusted_carbs": <número>, "adjusted_fat": <número>, "reason": "<explicación>", "training_adjustments": "<cambios recomendados en entrenamiento>" }`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}
