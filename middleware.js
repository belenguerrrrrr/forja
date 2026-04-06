import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Auth temporalmente desactivada — magic link apunta a localhost
  return NextResponse.next()
}

export const config = {
  // /auth/callback está excluido intencionalmente para que Supabase pueda
  // completar el intercambio de código sin requerir sesión previa.
  matcher: ['/pro/:path*', '/dashboard/:path*', '/onboarding/:path*'],
}
