import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/details') || 
      pathname.startsWith('/faq') ||
      pathname.startsWith('/generated') ||
      pathname.startsWith('/hightlight') ||
      pathname.startsWith('/news') ||
      pathname.startsWith('/setors')) {

    const token = request.cookies.get('token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*']
}