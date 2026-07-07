import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin');

  if (isOnAdmin) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    const userRole = (req.auth?.user as any)?.role;
    if (userRole !== 'admin') {
      return new NextResponse('Forbidden: Admin role required', { status: 403 });
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
