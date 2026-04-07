import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const pathname = request.nextUrl.pathname

  // Solo actuar en rutas protegidas
  if (!pathname.startsWith('/pro') && !pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

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

  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('MIDDLEWARE DEBUG:', {
    pathname,
    hasUser: !!user,
    userId: user?.id,
    error: error?.message,
    cookieCount: request.cookies.getAll().length,
  })

  if (!user) {
    console.log('MIDDLEWARE: No user, redirecting to /auth')
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (pathname.startsWith('/pro')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, subscription_status')
      .eq('id', user.id)
      .single()

    console.log('MIDDLEWARE PROFILE:', {
      plan: profile?.plan,
      status: profile?.subscription_status,
      profileError: profileError?.message,
    })

    const isPro = ['pro_monthly', 'pro_annual', 'lifetime'].includes(profile?.plan)

    if (!isPro) {
      console.log('MIDDLEWARE: Not pro, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard?upgrade=true', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/pro/:path*', '/dashboard/:path*'],
}
