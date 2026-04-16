import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const muscle_group = searchParams.get('muscle_group')
    const equipment = searchParams.get('equipment')
    const search = searchParams.get('search')

    let query = supabase.from('exercises').select('*')

    if (muscle_group) query = query.eq('muscle_group', muscle_group)
    if (equipment) query = query.eq('equipment', equipment)
    if (search) query = query.ilike('name_es', `%${search}%`)

    const { data, error } = await query.order('name_es')
    if (error) throw error

    return NextResponse.json({ exercises: data })
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo ejercicios' }, { status: 500 })
  }
}
