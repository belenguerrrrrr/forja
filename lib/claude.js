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
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
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
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
