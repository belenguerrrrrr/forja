import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { image_base64, media_type = 'image/jpeg' } = await request.json()

    if (!image_base64) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type,
              data: image_base64,
            },
          },
          {
            type: 'text',
            text: `Analiza esta imagen de comida y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional:
{
  "foods": [
    {
      "name": "nombre del alimento en español",
      "quantity_grams": estimación en gramos como número,
      "calories": calorías totales como número entero,
      "protein": proteínas en gramos como número decimal,
      "carbs": carbohidratos en gramos como número decimal,
      "fat": grasas en gramos como número decimal,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "total_calories": suma total de calorías,
  "total_protein": suma total proteínas,
  "total_carbs": suma total carbos,
  "total_fat": suma total grasas,
  "meal_description": "descripción breve de lo que ves en 1 frase"
}

Si no puedes identificar la comida con certeza razonable, usa confidence: "low" y haz tu mejor estimación. Siempre devuelve el JSON aunque no estés seguro.`
          }
        ],
      }],
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)

  } catch (error) {
    console.error('Food scan error:', error)
    return NextResponse.json({ error: 'Error analizando la imagen' }, { status: 500 })
  }
}
