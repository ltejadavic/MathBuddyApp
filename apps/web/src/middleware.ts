import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the HttpOnly refresh token cookie
  const refreshToken = request.cookies.get('refresh_token');
  const pathname = request.nextUrl.pathname;
  
  // If we're on a protected route and don't have a refresh token, redirect to login
  if (
    (pathname.startsWith('/admin') ||
     pathname.startsWith('/teacher') ||
     pathname.startsWith('/student')) &&
    !refreshToken
  ) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/login'],
};
