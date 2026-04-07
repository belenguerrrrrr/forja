import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { description, weight_kg } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Descripción vacía' }, { status: 400 })
    }

    const weight = weight_kg || 75

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Eres un experto en fisiología del ejercicio. El usuario pesa ${weight} kg y describe las actividades físicas que ha hecho hoy. Desglosa cada actividad por separado y calcula las calorías quemadas usando MET × peso(kg) × tiempo(h).

DESCRIPCIÓN: "${description}"

Para ritmos de carrera: convierte km + ritmo a minutos (ej: 5km a 4:30/km = 22.5 min). Para ritmos rápidos (< 5:00/km) usa MET 12-14; moderado (5:00-6:30/km) MET 10-11; suave (> 6:30/km) MET 8-9.
Para otros deportes: usa MET estándar (tenis suave 5, tenis competitivo 7.3, ciclismo moderado 8, natación 7, pesas 5, yoga 2.5, caminar 3.5, HIIT 10, fútbol 7, baloncesto 6.5, paddle 7).

Responde ÚNICAMENTE con JSON válido, sin texto extra:
{
  "activities": [
    {
      "name": "<nombre descriptivo de la actividad>",
      "emoji": "<emoji relevante>",
      "duration_minutes": <minutos como número entero>,
      "calories_burned": <kcal quemadas como número entero>,
      "notes": "<detalle opcional: ritmo, intensidad, distancia>"
    }
  ]
}

Reglas:
- Un emoji apropiado por actividad (🏃 correr, 🎾 tenis, 🚴 ciclismo, 🏊 natación, 🏋️ pesas, 🧘 yoga, 🚶 caminar, ⚡ HIIT, ⚽ fútbol, 🏀 baloncesto, 🎾 paddle)
- Redondea calorías al entero más cercano
- Si hay varias actividades en la descripción, devuélvelas por separado`,
      }],
    })

    const text = response.content[0].text
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const parsed = JSON.parse(match[0])
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Activity parse error:', err)
    return NextResponse.json({ error: 'Error al analizar la actividad' }, { status: 500 })
  }
}
