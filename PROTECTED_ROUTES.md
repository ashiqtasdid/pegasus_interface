# Authentication Protection

This file contains a list of routes that must be protected by authentication.

## Protected Routes
- /create
- /chat
- /plugins
- /profile
- /debug
- /test

## Public Routes
- / (home page)
- /auth/signin
- /auth/signup
- /api/auth/* (authentication API endpoints)
- /api/health (health check endpoints)

## Authentication Flow
1. User attempts to access a protected route
2. Middleware checks if the user is authenticated
3. If not authenticated, redirect to the sign-in page with the return URL
4. After successful authentication, redirect back to the original page
