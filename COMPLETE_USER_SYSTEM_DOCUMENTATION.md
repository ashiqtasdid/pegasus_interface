# 🔐 Pegasus Interface - Complete User System Documentation

This comprehensive documentation covers every aspect of the user authentication and management system in the Pegasus Interface project. This document is designed for backend API modification purposes and contains all necessary information for implementing user-related features.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Authentication Framework](#authentication-framework)
3. [Database Architecture](#database-architecture)
4. [User Schema & Models](#user-schema--models)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Route Protection](#route-protection)
8. [Session Management](#session-management)
9. [Password Management](#password-management)
10. [Environment Configuration](#environment-configuration)
11. [Security Features](#security-features)
12. [Integration Patterns](#integration-patterns)
13. [Error Handling](#error-handling)
14. [Deployment Configuration](#deployment-configuration)
15. [Code Examples](#code-examples)

---

## 🏗️ System Overview

### Technology Stack
- **Authentication Framework**: Better Auth v1.2.8
- **Database**: MongoDB Atlas with MongoDB Node.js Driver
- **Frontend**: Next.js 14 with React 18
- **Language**: TypeScript
- **Password Hashing**: bcrypt (via Better Auth)
- **Session Storage**: MongoDB with secure cookies

### Architecture Pattern
- **Server-Side Authentication**: Better Auth handles all authentication logic
- **Route-Level Protection**: Next.js middleware for route protection
- **Client-Side State Management**: Better Auth React hooks
- **API-First Design**: RESTful endpoints for all user operations

---

## 🔐 Authentication Framework

### Better Auth Configuration

**File**: `src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Create MongoDB client for MongoDB Atlas
const client = new MongoClient(process.env.MONGODB_URI!);

export const auth = betterAuth({
  database: mongodbAdapter(client.db("pegasus-auth")),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // don't allow user to set role during signup
      },
      displayName: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      preferences: {
        type: "string", // JSON string for user preferences
        required: false,
        defaultValue: "{}",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});
```

### Client-Side Auth Integration

**File**: `src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3001",
});

export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession, 
  getSession 
} = authClient;

// Define extended user type for our application
export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role?: string;
  displayName?: string;
  preferences?: string;
}
```

---

## 🗄️ Database Architecture

### MongoDB Collections

The system uses **MongoDB Atlas** with the following collections:

#### 1. Better Auth Collections (Auto-Created)
- **`user`** - Core user accounts and profiles
- **`session`** - User sessions and tokens
- **`account`** - OAuth provider accounts (GitHub, etc.)
- **`verification`** - Email verification tokens

#### 2. Application Collections
- **`pegasus_user_plugins`** - User-created plugins
- **`pegasus_chat_messages`** - Chat conversation messages
- **`pegasus_chat_conversations`** - Chat conversation metadata

### Database Connection

**File**: `src/lib/database.ts`

```typescript
import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  try {
    const mongodbUri = process.env.MONGODB_URI;
    
    if (!mongodbUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    client = new MongoClient(mongodbUri);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    // Use the same database as Better Auth
    db = client.db('better-auth');
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    client = null;
    db = null;
    throw error;
  }
}
```

---

## 👤 User Schema & Models

### Core User Model (Better Auth)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  
  // Custom fields
  role: string; // "user" | "moderator" | "admin"
  displayName: string;
  preferences: string; // JSON string
}
```

### Application Models

**File**: `src/lib/database.ts`

```typescript
export interface UserPlugin {
  _id?: string;
  userId: string;
  pluginName: string;
  pluginData?: string; // JSON string of plugin metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'compiling' | 'success' | 'failed';
  downloadCount: number;
}

export interface ChatMessage {
  _id?: string;
  userId: string;
  pluginName: string;
  message: string;
  response: string;
  messageType: 'info' | 'modification';
  operations?: FileOperation[];
  compilationResult?: CompilationResult;
  timestamp: Date;
  conversationId: string;
}

export interface FileOperation {
  type: 'create' | 'modify' | 'delete';
  file: string;
  content: string;
}

export interface CompilationResult {
  success: boolean;
  output: string;
  errors: string[];
}

export interface ChatConversation {
  _id?: string;
  userId: string;
  pluginName: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}
```

---

## 🛡️ API Endpoints

### Better Auth Endpoints (Auto-Generated)

- `POST /api/auth/sign-in` - User sign in
- `POST /api/auth/sign-up` - User registration  
- `POST /api/auth/sign-out` - User sign out
- `GET /api/auth/session` - Get current session
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Complete password reset
- `GET /api/auth/callback/github` - GitHub OAuth callback

### Custom Auth Endpoints

#### Update Profile
**File**: `src/app/api/auth/update-profile/route.ts`

```typescript
POST /api/auth/update-profile
Content-Type: application/json

Request Body:
{
  "displayName": "New Display Name"
}

Response:
{
  "success": true,
  "user": { /* updated user object */ }
}
```

#### Change Password
**File**: `src/app/api/auth/change-password/route.ts`

```typescript
POST /api/auth/change-password
Content-Type: application/json

Request Body:
{
  "currentPassword": "current123",
  "newPassword": "newpassword123"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Application API Endpoints

#### User Plugins
**File**: `src/app/api/plugins/user/route.ts`

```typescript
// Get user plugins
GET /api/plugins/user
Authorization: Session Cookie

Response:
{
  "success": true,
  "plugins": [
    {
      "_id": "plugin_id",
      "userId": "user_id",
      "pluginName": "My Plugin",
      "pluginData": "{}",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "status": "success",
      "downloadCount": 5
    }
  ]
}

// Save user plugin
POST /api/plugins/user
Content-Type: application/json
Authorization: Session Cookie

Request Body:
{
  "pluginName": "My New Plugin",
  "pluginData": { /* plugin metadata */ },
  "status": "pending"
}

Response:
{
  "success": true,
  "pluginId": "new_plugin_id"
}
```

#### Chat System
**Files**: `src/app/api/chat/send/route.ts`, `src/app/api/chat/history/route.ts`

```typescript
// Send chat message
POST /api/chat/send
Content-Type: application/json
Authorization: Session Cookie

Request Body:
{
  "message": "User message content",
  "pluginName": "Target Plugin Name",
  "conversationId": "conversation_id" // Optional, creates new if not provided
}

Response:
{
  "success": true,
  "response": "AI response content",
  "messageId": "message_id",
  "conversationId": "conversation_id",
  "operations": [/* file operations */],
  "compilationResult": {
    "success": true,
    "output": "compilation output",
    "errors": []
  }
}

// Get chat history
GET /api/chat/history?conversationId=conversation_id
Authorization: Session Cookie

Response:
{
  "success": true,
  "messages": [
    {
      "_id": "message_id",
      "userId": "user_id",
      "pluginName": "plugin_name",
      "message": "user message",
      "response": "ai response",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "operations": [/* file operations */],
      "compilationResult": { /* compilation result */ }
    }
  ]
}
```

#### Plugin Generation
**File**: `src/app/api/generate/route.ts`

```typescript
// Generate new plugin (proxy to external API)
POST /api/generate
Content-Type: application/json

Request Body:
{
  "description": "Plugin description",
  "requirements": "Plugin requirements",
  /* other plugin generation parameters */
}

Response:
{
  "message": "Generated plugin content"
}
```

#### Health Check
**File**: `src/app/api/health/route.ts`

```typescript
// System health check
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "auth": "operational"
}
```

#### Database Initialization
**File**: `src/app/api/init-db/route.ts`

```typescript
// Initialize database collections
POST /api/init-db
Authorization: Session Cookie (Admin only)

Response:
{
  "success": true,
  "message": "Database initialized successfully",
  "collections": ["pegasus_user_plugins", "pegasus_chat_messages", "pegasus_chat_conversations"]
}
```

#### Plugin Download
**File**: `src/app/api/download/[pluginName]/route.ts`

```typescript
// Download generated plugin
GET /api/download/{pluginName}
Authorization: Session Cookie

Response:
- Content-Type: application/zip
- Binary plugin file download
```

### Authentication Requirements for API Endpoints

#### Protected Endpoints (Require User Authentication)
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history` - Get chat history  
- `GET /api/plugins/user` - Get user plugins
- `POST /api/plugins/user` - Save user plugin
- `GET /api/download/[pluginName]` - Download plugin
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/update-profile` - Update profile
- `POST /api/init-db` - Initialize database (admin only)

#### Public Endpoints (No Authentication Required)
- `GET /api/health` - Health check
- `POST /api/generate` - Generate plugin (proxy endpoint)
- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get session

#### Role-Based Access
```typescript
// Example role-based endpoint protection
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  
  // Admin-only endpoint
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with admin operation
}
```
---

## 🧩 Frontend Components

### Authentication Form
**File**: `src/components/AuthForm.tsx`

Features:
- Unified sign-in/sign-up form
- Email/password validation
- Loading states and error handling
- Responsive design
- Auto-redirect after successful authentication

### User Profile Management
**File**: `src/components/UserProfile.tsx`

Features:
- Display user information
- Edit display name
- Change password functionality
- Role-based UI elements
- Account information display

### Navigation Integration
**File**: `src/components/Navigation.tsx`

Features:
- User menu with avatar
- Sign out functionality
- Role-based navigation items
- Authentication state management

---

## 🔒 Route Protection

### Middleware Configuration
**File**: `middleware.ts`

```typescript
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
    console.log(`[AUTH] Redirecting authenticated user from ${pathname} to home`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Protected Routes List

**Public Routes** (No Authentication Required):
- `/` - Home page
- `/auth/signin` - Sign-in page
- `/auth/signup` - Sign-up page
- `/api/auth/*` - Authentication API endpoints
- `/api/health` - Health check endpoints

**Protected Routes** (Authentication Required):
- `/chat` - Chat interface
- `/create` - Plugin creation
- `/plugins` - Plugin management
- `/profile` - User profile
- `/debug` - Debug utilities
- `/test` - Testing utilities

---

## 🔄 Session Management

### Session Configuration
- **Duration**: 7 days
- **Renewal**: Every 24 hours
- **Storage**: MongoDB with secure HTTP-only cookies
- **Security**: CSRF protection, secure cookies in production

### Session Usage in API Routes

```typescript
// Get session in API route
const session = await auth.api.getSession({
  headers: request.headers,
});

if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Access user information
const userId = session.user.id;
const userRole = (session.user as any).role;
```

### Session Usage in Components

```typescript
// Get session in React component
const { data: session, isPending } = useSession();

if (isPending) {
  return <div>Loading...</div>;
}

if (!session?.user) {
  return <div>Please sign in</div>;
}

// Access user information
const user = session.user as ExtendedUser;
```

---

## 🔐 Password Management

### Password Requirements
- **Minimum Length**: 8 characters
- **Maximum Length**: 128 characters
- **Hashing**: bcrypt with salt rounds (handled by Better Auth)
- **Validation**: Client-side and server-side validation

### Password Change Flow

```typescript
// Client-side password change
const handlePasswordChange = async () => {
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to change password');
    }

    // Password changed successfully
    setPasswordSuccess('Password changed successfully!');
  } catch (err) {
    setPasswordError(err.message);
  }
};
```

### Password Reset Flow

```typescript
// Initiate password reset
POST /api/auth/forgot-password
{
  "email": "user@example.com",
  "redirectTo": "https://yourapp.com/reset-password"
}

// Complete password reset
POST /api/auth/reset-password
{
  "token": "reset_token_from_email",
  "newPassword": "new_password_123"
}
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/better-auth?retryWrites=true&w=majority

# Authentication
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_URL=http://localhost:3001

# OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Production Environment

```bash
# Production URLs
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_AUTH_URL=https://yourdomain.com

# Generate secure secret
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

---

## 🛡️ Security Features

### Built-in Security
- **CSRF Protection**: Automatic CSRF token validation
- **Session Security**: HTTP-only, secure cookies
- **Password Hashing**: bcrypt with automatic salt generation
- **SQL Injection Protection**: MongoDB parameterized queries
- **Rate Limiting**: Built-in request rate limiting

### Custom Security Measures
- **Role-Based Access Control**: User roles (user, moderator, admin)
- **Input Validation**: Zod schemas for API validation
- **Error Handling**: Secure error messages (no sensitive data leakage)
- **HTTPS Enforcement**: Secure cookies only in production

### Security Headers
```typescript
// Add to next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

## 🔗 Integration Patterns

### API Integration Pattern

```typescript
// Standard API route with authentication
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { field1, field2 } = body;

    if (!field1) {
      return NextResponse.json({ 
        error: 'Field1 is required' 
      }, { status: 400 });
    }

    // 3. Perform operation with user context
    const result = await DatabaseService.performOperation({
      userId: session.user.id,
      field1,
      field2,
    });

    // 4. Return success response
    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### Component Integration Pattern

```typescript
// Standard authenticated component
export const AuthenticatedComponent: React.FC = () => {
  const { data: session, isPending } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading state
  if (isPending) {
    return <LoadingSpinner />;
  }

  // Not authenticated
  if (!session?.user) {
    return <SignInPrompt />;
  }

  // API call with authentication
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/protected-endpoint', {
        method: 'GET',
        // Session cookie is automatically included
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

---

## ❌ Error Handling

### Authentication Errors

```typescript
// Common authentication error responses
{
  "error": "Unauthorized",
  "status": 401
}

{
  "error": "Invalid credentials",
  "status": 400
}

{
  "error": "User not found",
  "status": 404
}

{
  "error": "Password too short",
  "status": 400
}
```

### Client-Side Error Handling

```typescript
// Component error state management
const [error, setError] = useState<string | null>(null);

const handleApiCall = async () => {
  try {
    setError(null);
    const response = await fetch('/api/endpoint');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }
    
    // Success handling
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  }
};

// Error display
{error && (
  <div className="error-message">
    <AlertCircle className="w-5 h-5" />
    <span>{error}</span>
  </div>
)}
```

---

## 🚀 Deployment Configuration

### MongoDB Atlas Setup
1. Create MongoDB Atlas cluster
2. Configure network access (IP whitelist)
3. Create database user with read/write permissions
4. Get connection string

### Vercel Deployment
1. Set environment variables in Vercel dashboard
2. Configure production URLs
3. Enable HTTPS
4. Set up custom domain (optional)

### Environment Variables for Production
```bash
# Production MongoDB
MONGODB_URI=mongodb+srv://prod_user:password@prod-cluster.mongodb.net/better-auth

# Production Authentication
BETTER_AUTH_SECRET=production-secret-key
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_AUTH_URL=https://yourdomain.com

# Production OAuth
GITHUB_CLIENT_ID=prod_github_client_id
GITHUB_CLIENT_SECRET=prod_github_client_secret
```

---

## 💻 Code Examples

### Complete User Registration Flow

```typescript
// 1. Frontend registration form
const handleSignUp = async (email: string, password: string, name: string) => {
  try {
    const { data, error } = await signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Registration successful, user is now signed in
    router.push('/profile');
  } catch (err) {
    setError(err.message);
  }
};

// 2. Backend registration handling (automatic via Better Auth)
// Better Auth handles:
// - Password hashing
// - User creation in database
// - Session creation
// - Cookie setting
```

### Complete Authentication Check

```typescript
// API route authentication check
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated, proceed with operation
  const user = session.user;
  const userId = user.id;
  const userRole = (user as any).role;

  return NextResponse.json({ 
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      role: userRole,
    }
  });
}
```

### Database Operation with User Context

```typescript
// Database service with user context
export class DatabaseService {
  static async getUserData(userId: string) {
    try {
      const db = await ensureConnection();
      
      // Get user plugins
      const plugins = await db.collection('pegasus_user_plugins')
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();

      // Get user conversations
      const conversations = await db.collection('pegasus_chat_conversations')
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();

      return {
        plugins,
        conversations,
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch user data');
    }
  }
}
```

---

## 🔧 Backend API Integration Guide

### For External Backend Services

When integrating with external backend services, follow these patterns for user authentication and data access:

#### User Authentication Token Extraction

```typescript
// Extract user session from Next.js API request
import { auth } from '@/lib/auth';

export async function authenticateRequest(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role,
      displayName: (session.user as any).displayName,
    }
  };
}
```

#### User Context for Backend Services

```typescript
// Standard user context interface for backend APIs
interface UserContext {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
  displayName: string;
  isAuthenticated: boolean;
}

// Extract user context helper
export async function getUserContext(request: NextRequest): Promise<UserContext | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return null;
  }
  
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role || 'user',
    displayName: (session.user as any).displayName || session.user.name,
    isAuthenticated: true,
  };
}
```

#### Session Validation for External APIs

```typescript
// Validate session for external API calls
export async function validateUserSession(sessionToken: string): Promise<UserContext | null> {
  try {
    // For external services, you might need to verify the session token
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/session`, {
      headers: {
        'Cookie': `better-auth.session_token=${sessionToken}`
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const sessionData = await response.json();
    
    if (!sessionData.user) {
      return null;
    }
    
    return {
      userId: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      role: sessionData.user.role || 'user',
      displayName: sessionData.user.displayName || sessionData.user.name,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}
```

#### API Integration Patterns

```typescript
// Pattern 1: Direct database access with user context
export class UserDataService {
  static async getUserPlugins(userId: string) {
    const { db } = await connectToDatabase();
    
    return await db.collection('pegasus_user_plugins')
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();
  }
  
  static async createUserPlugin(userId: string, pluginData: any) {
    const { db } = await connectToDatabase();
    
    const plugin = {
      userId,
      ...pluginData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('pegasus_user_plugins').insertOne(plugin);
    return result.insertedId;
  }
}

// Pattern 2: API endpoint with user authentication
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const userContext = await getUserContext(request);
  
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Parse request
  const body = await request.json();
  
  // 3. Validate permissions
  if (body.action === 'admin' && userContext.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 4. Perform operation with user context
  const result = await UserDataService.performOperation({
    userId: userContext.userId,
    ...body
  });
  
  return NextResponse.json({ success: true, data: result });
}

// Pattern 3: External service integration
export async function callExternalService(userContext: UserContext, data: any) {
  const response = await fetch('https://external-api.com/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userContext.userId,
      'X-User-Role': userContext.role,
      'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
    },
    body: JSON.stringify({
      userId: userContext.userId,
      userEmail: userContext.email,
      ...data
    }),
  });
  
  if (!response.ok) {
    throw new Error(`External API error: ${response.status}`);
  }
  
  return await response.json();
}
```

#### Database Query Patterns with User Context

```typescript
// Safe database queries with user context
export class DatabaseQueries {
  // Get user-specific data
  static async getUserData(userId: string, collection: string, filter: any = {}) {
    const { db } = await connectToDatabase();
    
    return await db.collection(collection)
      .find({ userId, ...filter })
      .toArray();
  }
  
  // Create user-specific data
  static async createUserData(userId: string, collection: string, data: any) {
    const { db } = await connectToDatabase();
    
    const document = {
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return await db.collection(collection).insertOne(document);
  }
  
  // Update user-specific data
  static async updateUserData(userId: string, collection: string, filter: any, update: any) {
    const { db } = await connectToDatabase();
    
    return await db.collection(collection).updateOne(
      { userId, ...filter },
      { 
        $set: { 
          ...update, 
          updatedAt: new Date() 
        } 
      }
    );
  }
  
  // Delete user-specific data
  static async deleteUserData(userId: string, collection: string, filter: any) {
    const { db } = await connectToDatabase();
    
    return await db.collection(collection).deleteMany({ userId, ...filter });
  }
}
```

#### Error Handling for Backend Integration

```typescript
// Standardized error responses
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error handling middleware
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'Unknown error occurred' },
    { status: 500 }
  );
}

// Usage in API routes
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    
    if (!userContext) {
      throw new ApiError('User not authenticated', 401, 'AUTH_REQUIRED');
    }
    
    // API logic here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---
