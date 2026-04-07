/**
 * Crea un cliente Supabase autenticado con el token Bearer del header Authorization.
 * Úsalo en API routes para que la sesión del cliente se propague al servidor.
 *
 * @param {Request} request
 * @returns {{ supabase, user } | { error: Response }}
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  return { supabase, user }
}
