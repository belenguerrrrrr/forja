import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // En Vercel, `origin` puede ser una URL interna. Usar x-forwarded-host
      // para construir la URL pública correcta y evitar el redirect loop.
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv || !forwardedHost) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const base = isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`
  return NextResponse.redirect(`${base}/auth?error=callback`)
}
