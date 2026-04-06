import { generatePlan } from '@/lib/claude'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const userData = await request.json()
    const plan = await generatePlan(userData)
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Error generating preview plan:', error)
    return NextResponse.json({ error: 'Error al generar el plan.' }, { status: 500 })
  }
}
