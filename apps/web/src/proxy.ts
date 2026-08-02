import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // We can check for the presence of the authentication cookie
  const authCookie = request.cookies.get('Authentication');
  
  // If we're on a protected route and not authenticated, redirect to login
  if (request.nextUrl.pathname.startsWith('/dashboard') && !authCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If we're on the login page and ALREADY authenticated, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && authCookie) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
