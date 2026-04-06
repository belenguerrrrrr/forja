import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { description } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Descripción vacía' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Eres un nutricionista experto en cocina española y mediterránea.
El usuario describe lo que ha comido. Estima los gramos de cada alimento (si no los menciona, usa una porción típica española) y calcula sus macros.

DESCRIPCIÓN: "${description}"

Responde ÚNICAMENTE con JSON válido, sin texto extra:
{
  "items": [
    {
      "name": "<nombre del alimento, descriptivo>",
      "grams": <gramos estimados como número>,
      "calories": <kcal como número decimal>,
      "protein": <proteína en g como número decimal>,
      "carbs": <carbohidratos en g como número decimal>,
      "fat": <grasa en g como número decimal>
    }
  ]
}

Reglas:
- Desglosa cada ingrediente por separado
- "Un poco de AOVE" ≈ 5g (media cucharadita)
- "Un café con leche" ≈ 30ml espresso + 100ml leche semidesnatada
- "Una tostada pequeña" ≈ 25-30g de pan
- Redondea a 1 decimal los macros
- Si algo es agua o infusión sin azúcar, ponlo con 0 calorías`,
      }],
    })

    const text = response.content[0].text
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const parsed = JSON.parse(match[0])
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Nutrition parse error:', err)
    return NextResponse.json({ error: 'Error al analizar la descripción' }, { status: 500 })
  }
}
