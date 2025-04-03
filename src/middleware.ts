import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Add paths that should be protected (require authentication)
const protectedPaths = ['/dashboard'];

// Add paths that should be accessible only to non-authenticated users
const authPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем режим разработки
  const isDevelopmentMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  if (isDevelopmentMode) {
    console.log('⚠️ Running in development mode - bypassing authentication');
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  try {
    if (token) {
      // Verify token
      const verified = await jwtVerify(token, JWT_SECRET);
      const isValid = !!verified.payload;

      // If token is valid and trying to access auth pages, redirect to dashboard
      if (isValid && isAuthPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // If token is valid and accessing protected path, allow access
      if (isValid && isProtectedPath) {
        return NextResponse.next();
      }
    }

    // If no token and trying to access protected path, redirect to login
    if (isProtectedPath) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // Allow access to public paths
    return NextResponse.next();
  } catch (error) {
    // If token verification fails, clear the cookie and redirect to login if accessing protected path
    if (isProtectedPath) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
