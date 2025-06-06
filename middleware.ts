import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Define exact paths that are public (accessible without authentication)
const PUBLIC_PATHS = ['/', '/auth/signin', '/auth/signup'];

// Define API paths that should be accessible without authentication
const PUBLIC_API_PATHS = ['/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip authentication check for auth API routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/favicon.ico') || 
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  const isAuthenticated = !!session;
  
  // Check if this is a public path that doesn't require authentication
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  
  // Check if this is a public API path that doesn't require authentication
  const isPublicApiPath = PUBLIC_API_PATHS.some(path => pathname.startsWith(path));
  
  // If user is not authenticated and trying to access a protected route, redirect to sign-in
  if (!isAuthenticated && !isPublicPath && !isPublicApiPath && !pathname.startsWith('/api/auth/')) {
    console.log(`[AUTH] Blocking access to ${pathname} - User not authenticated`);
    // Redirect to sign in page with return URL
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';
    return NextResponse.redirect(new URL(returnTo, request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    // Match ALL paths except static resources
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
