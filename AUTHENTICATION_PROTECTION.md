# Authentication Protection System

This document explains the dual-layer authentication protection implemented in the Pegasus Interface application.

## Overview

The application uses a two-tier approach to protect routes:

1. **Server-side middleware protection** - Intercepts requests at the network level
2. **Client-side component protection** - Adds an additional layer of protection in the React components

This approach provides redundancy and ensures that protected routes are secure even if one layer fails.

## Server-Side Protection (Middleware)

The `middleware.ts` file provides server-side protection:

```typescript
// If user is not authenticated and trying to access a protected route, redirect to sign-in
if (!isAuthenticated && !isPublicPath && !isPublicApiPath && !pathname.startsWith('/api/auth/')) {
  console.log(`[AUTH] Blocking access to ${pathname} - User not authenticated`);
  // Redirect to sign in page with return URL
  const signInUrl = new URL('/auth/signin', request.url);
  signInUrl.searchParams.set('returnTo', pathname);
  return NextResponse.redirect(signInUrl);
}
```

The middleware:
- Checks all incoming requests
- Allows access to public routes without authentication
- Redirects unauthenticated users to the sign-in page
- Preserves the original URL as a return parameter

## Client-Side Protection (HOC)

The `withAuth` Higher-Order Component adds client-side protection:

```typescript
// withAuth.tsx
export default function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const { data: session, loading } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !session) {
        router.push(`/auth/signin?returnTo=${encodeURIComponent(window.location.pathname)}`);
      }
    }, [session, loading, router]);

    // Show loading state while checking authentication
    if (loading || !session) {
      return <Loading />;
    }

    // User is authenticated, render the protected component
    return <Component {...props} />;
  };
}
```

The client-side protection:
- Works inside the browser
- Checks session state on component mount
- Shows a loading indicator during authentication check
- Redirects to sign-in if no session exists

## Protected Routes

The following routes are protected and require authentication:

- `/chat` - Chat interface
- `/create` - Plugin creation
- `/plugins` - Plugin management
- `/profile` - User profile
- `/debug` - Debug utilities
- `/test` - Testing utilities

## Public Routes

These routes are accessible without authentication:

- `/` - Home page
- `/auth/signin` - Sign-in page
- `/auth/signup` - Sign-up page
- `/api/auth/*` - Authentication API endpoints
- `/api/health` - Health check API

## Authentication Flow

1. User attempts to access a protected route (e.g., `/plugins`)
2. Server middleware checks if the user is authenticated
3. If not authenticated, redirects to sign-in page with return URL
4. If the middleware fails, the client-side `withAuth` HOC provides a backup
5. After successful authentication, user is redirected back to the original page

## Verification

You can verify the authentication protection using the `verify-auth.sh` script:

```bash
./verify-auth.sh
```

This script checks if all protected routes are using the `withAuth` HOC.
