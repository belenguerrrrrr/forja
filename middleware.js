import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Auth temporalmente desactivada — magic link apunta a localhost
  return NextResponse.next()
}

export const config = {
  matcher: ['/pro/:path*', '/dashboard/:path*', '/onboarding/:path*'],
}
