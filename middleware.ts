import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Login sahifasiga har doim ruxsat
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }
  
  // Static fayllar va API lar uchun ruxsat
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Middleware da localStorage ga kirish imkoni yo'q,
  // shuning uchun auth tekshiruvi client tarafida bo'ladi
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
