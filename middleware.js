import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas que requieren autenticación
  if (request.nextUrl.pathname.startsWith('/pro') ||
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/onboarding')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  // Rutas que requieren plan Pro
  if (request.nextUrl.pathname.startsWith('/pro')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const isPro = ['pro_monthly', 'pro_annual', 'lifetime'].includes(profile?.plan)

    if (!isPro) {
      return NextResponse.redirect(new URL('/dashboard?upgrade=true', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/pro/:path*', '/dashboard/:path*', '/onboarding/:path*'],
}
