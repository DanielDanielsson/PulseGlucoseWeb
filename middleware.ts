import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { OWNER_SESSION_COOKIE, ownerSessionCookieValue } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', callbackUrl);

  if (request.cookies.get(OWNER_SESSION_COOKIE)?.value !== ownerSessionCookieValue()) {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*']
};
