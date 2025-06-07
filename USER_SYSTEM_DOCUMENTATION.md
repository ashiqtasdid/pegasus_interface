# 🔐 Pegasus Interface - Complete User System Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Authentication Framework](#authentication-framework)
3. [User Schema & Models](#user-schema--models)
4. [Database Architecture](#database-architecture)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Route Protection System](#route-protection-system)
8. [Session Management](#session-management)
9. [Security Features](#security-features)
10. [Environment Configuration](#environment-configuration)
11. [Integration Points](#integration-points)
12. [Error Handling](#error-handling)
13. [Custom Extensions](#custom-extensions)
14. [Backend API Integration](#backend-api-integration)

---

## 🎯 System Overview

### Technology Stack
- **Authentication Library**: Better Auth v1.2.8
- **Database**: MongoDB Atlas (Cloud Database)
- **Session Storage**: MongoDB Collections + Optional Secondary Storage
- **Frontend Framework**: Next.js 15.3.3 with TypeScript
- **Styling**: Tailwind CSS with custom dark mode support
- **State Management**: React hooks + Better Auth React integration

### Core Features
- ✅ Email/Password Authentication
- ✅ GitHub OAuth Integration (configured)
- ✅ Role-Based Access Control (RBAC)
- ✅ Session Management with Auto-Renewal
- ✅ User Profile Management
- ✅ Password Management (Change/Reset)
- ✅ Route Protection (Server + Client Side)
- ✅ Responsive UI Components
- ✅ TypeScript Support Throughout

---

## 🔐 Authentication Framework

### Better Auth Configuration
```typescript
// File: src/lib/auth.ts
export const auth = betterAuth({
  database: mongodbAdapter(client.db("pegasus-auth")),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
        input: false,
      },
      displayName: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      preferences: {
        type: "string", // JSON string
        required: false,
        defaultValue: "{}",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
});
```

### Client-Side Auth Integration
```typescript
// File: src/lib/auth-client.ts
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

// Extended user type for the application
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

## 👤 User Schema & Models

### Core User Model (Better Auth)
```typescript
interface User {
  id: string;                    // Primary key
  name: string;                  // Full name
  email: string;                 // Email (unique)
  emailVerified: boolean;        // Email verification status
  image?: string | null;         // Profile image URL
  createdAt: Date;              // Account creation timestamp
  updatedAt: Date;              // Last update timestamp
  
  // Custom fields
  role: string;                 // "user" | "moderator" | "admin"
  displayName: string;          // Display name (customizable)
  preferences: string;          // JSON string for user preferences
}
```

### Session Model
```typescript
interface Session {
  id: string;                   // Session ID
  token: string;                // Session token (unique)
  userId: string;               // Foreign key to User
  expiresAt: Date;             // Session expiration
  createdAt: Date;             // Session creation
  updatedAt: Date;             // Last session update
  ipAddress?: string;          // Client IP address
  userAgent?: string;          // Client user agent
}
```

### Application-Specific User Models
```typescript
// File: src/lib/database.ts

// User's generated plugins
interface UserPlugin {
  _id?: string;
  userId: string;               // Links to Better Auth user.id
  pluginName: string;
  pluginData?: string;          // JSON metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'compiling' | 'success' | 'failed';
  downloadCount: number;
}

// Chat messages between user and AI
interface ChatMessage {
  _id?: string;
  userId: string;               // Links to Better Auth user.id
  pluginName: string;
  message: string;              // User input
  response: string;             // AI response
  messageType: 'info' | 'modification';
  operations?: FileOperation[];
  compilationResult?: CompilationResult;
  timestamp: Date;
  conversationId: string;
}

// Chat conversation management
interface ChatConversation {
  _id?: string;
  userId: string;               // Links to Better Auth user.id
  pluginName: string;
  title: string;                // Auto-generated from first message
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}
```

---

## 🗄️ Database Architecture

### MongoDB Collections

#### Better Auth Collections (Auto-Created)
- **`user`** - Core user accounts and profiles
- **`session`** - User sessions and tokens
- **`account`** - OAuth provider accounts (GitHub, etc.)
- **`verification`** - Email verification tokens

#### Application Collections
- **`pegasus_user_plugins`** - User-generated plugins
- **`pegasus_chat_messages`** - Chat history and AI interactions
- **`pegasus_chat_conversations`** - Conversation management

### Database Connection
```typescript
// File: src/lib/database.ts
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) return { client, db };
  
  const mongodbUri = process.env.MONGODB_URI;
  client = new MongoClient(mongodbUri);
  await client.connect();
  db = client.db('better-auth'); // Same DB as Better Auth
  
  return { client, db };
}
```

### Database Service Layer
```typescript
export class DatabaseService {
  // User Plugins
  static async saveUserPlugin(plugin: Omit<UserPlugin, '_id' | 'createdAt' | 'updatedAt'>): Promise<string>
  static async getUserPlugins(userId: string): Promise<UserPlugin[]>
  static async updatePluginStatus(userId: string, pluginName: string, status: UserPlugin['status']): Promise<void>
  
  // Chat Management
  static async createConversation(userId: string, pluginName: string, firstMessage: string): Promise<string>
  static async saveChatMessage(message: Omit<ChatMessage, '_id' | 'timestamp'>): Promise<string>
  static async getChatMessages(userId: string, conversationId: string): Promise<ChatMessage[]>
  static async deleteConversation(userId: string, conversationId: string): Promise<void>
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
```typescript
// File: src/app/api/auth/update-profile/route.ts
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
```typescript
// File: src/app/api/auth/change-password/route.ts
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

#### Plugin Management
- `GET /api/plugins/user` - Get user's plugins
- `POST /api/generate` - Generate new plugin
- `GET /api/download/[pluginName]` - Download plugin file

#### Chat System
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/conversations` - Get user conversations

#### Utility
- `GET /api/health` - Health check
- `POST /api/init-db` - Initialize database

### Authentication Requirements

**Protected Endpoints** (Require Authentication):
- All `/api/plugins/*` routes
- All `/api/chat/*` routes
- `/api/auth/update-profile`
- `/api/auth/change-password`

**Public Endpoints**:
- `/api/health`
- `/api/init-db`
- All Better Auth endpoints (`/api/auth/*`)

---

## 🎨 Frontend Components

### Authentication Components

#### AuthForm Component
```typescript
// File: src/components/AuthForm.tsx
interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

Features:
- Email/password authentication
- GitHub OAuth integration
- Form validation
- Loading states
- Error handling
- Responsive design
```

#### UserProfile Component
```typescript
// File: src/components/UserProfile.tsx
Features:
- Display user information
- Edit display name
- Change password
- Account management
- Role display
- Sign out functionality
```

### Navigation Integration
```typescript
// File: src/components/Navigation.tsx
Features:
- User authentication status
- User menu dropdown
- Sign in/out buttons
- Profile access
- Responsive mobile menu
```

### Higher-Order Components

#### withAuth HOC
```typescript
// File: src/components/withAuth.tsx
export default function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const { data: session, loading } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !session) {
        router.push(`/auth/signin?returnTo=${encodeURIComponent(window.location.pathname)}`);
      }
    }, [session, loading, router]);

    if (loading || !session) {
      return <Loading />;
    }

    return <Component {...props} />;
  };
}
```

### Usage Examples

#### Check Authentication Status
```typescript
import { useSession } from '@/lib/auth-client';

function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

#### Access User Information
```typescript
import { ExtendedUser } from '@/lib/auth-client';

function UserInfo() {
  const { data: session } = useSession();
  
  if (!session) return null;
  
  const user = session.user as ExtendedUser;
  
  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Display Name: {user.displayName}</p>
      <p>Role: {user.role}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

---

## 🛡️ Route Protection System

### Server-Side Protection (Middleware)
```typescript
// File: middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth API routes and static assets
  if (pathname.startsWith('/api/auth/') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  const isAuthenticated = !!session;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  
  // Redirect unauthenticated users to sign-in
  if (!isAuthenticated && !isPublicPath) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';
    return NextResponse.redirect(new URL(returnTo, request.url));
  }
  
  return NextResponse.next();
}
```

### Protected Routes
- `/chat` - Chat interface
- `/create` - Plugin creation
- `/plugins` - Plugin management  
- `/profile` - User profile
- `/debug` - Debug utilities
- `/test` - Testing utilities

### Public Routes
- `/` - Home page
- `/auth/signin` - Sign-in page
- `/auth/signup` - Sign-up page
- `/api/auth/*` - Authentication endpoints
- `/api/health` - Health check

### Client-Side Protection
Components can use the `withAuth` HOC or `useSession` hook for additional protection:

```typescript
// Protect a page component
export default withAuth(function ProtectedPage() {
  return <div>This page requires authentication</div>;
});

// Protect specific content
function ConditionalContent() {
  const { data: session } = useSession();
  
  if (!session) {
    return <div>Please sign in to access this content</div>;
  }
  
  return <div>Protected content here</div>;
}
```

---

## 🔄 Session Management

### Session Configuration
```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 24 hours (auto-refresh threshold)
}
```

### Session Lifecycle
1. **Creation**: When user signs in successfully
2. **Storage**: HttpOnly cookie + MongoDB record
3. **Validation**: On each protected request
4. **Refresh**: Automatically when 1 day from expiry
5. **Expiration**: After 7 days of inactivity
6. **Deletion**: On explicit sign out

### Session Security Features
- **HttpOnly Cookies**: Prevent XSS attacks
- **Secure Transmission**: HTTPS in production
- **Signed Cookies**: Tamper-proof with secret
- **IP Tracking**: Optional IP address logging
- **User Agent Tracking**: Device fingerprinting
- **Auto-Refresh**: Seamless session extension

### Server-Side Session Access
```typescript
// In API routes
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  // Handle authenticated request
}
```

### Client-Side Session Access
```typescript
import { useSession, getSession } from '@/lib/auth-client';

// Hook-based (reactive)
function MyComponent() {
  const { data: session, isPending, error } = useSession();
  // Component re-renders when session changes
}

// Promise-based (one-time)
async function checkAuth() {
  const session = await getSession();
  return !!session;
}
```

---

## 🔒 Security Features

### Password Security
- **Hashing**: bcrypt algorithm
- **Minimum Length**: 6 characters (configurable)
- **Strength Validation**: Client-side checking
- **Change Workflow**: Requires current password

### Session Security
- **HttpOnly Cookies**: JavaScript cannot access
- **Secure Flag**: HTTPS transmission only
- **SameSite**: CSRF protection
- **Signed Cookies**: Integrity verification
- **Expiration**: Time-based invalidation

### Request Security
- **CSRF Protection**: Built into Better Auth
- **Input Validation**: Server-side validation
- **SQL Injection**: Prevented by MongoDB
- **XSS Protection**: Content sanitization

### Database Security
- **Connection Encryption**: TLS/SSL
- **Access Control**: Database user permissions
- **Network Security**: IP whitelisting (MongoDB Atlas)
- **Data Encryption**: At-rest encryption (Atlas)

### Environment Security
```bash
# Required environment variables
MONGODB_URI=mongodb+srv://...           # Database connection
BETTER_AUTH_SECRET=...                  # Session signing secret
BETTER_AUTH_URL=https://...             # Auth base URL
NEXT_PUBLIC_AUTH_URL=https://...        # Client auth URL
GITHUB_CLIENT_ID=...                    # OAuth client ID
GITHUB_CLIENT_SECRET=...                # OAuth client secret
```

---

## ⚙️ Environment Configuration

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pegasus-auth?retryWrites=true&w=majority

# Authentication
BETTER_AUTH_SECRET=your-32-char-secret-here
BETTER_AUTH_URL=http://localhost:3001        # Development
NEXT_PUBLIC_AUTH_URL=http://localhost:3001   # Client-side URL

# OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Production URLs
BETTER_AUTH_URL=https://your-domain.com      # Production
NEXT_PUBLIC_AUTH_URL=https://your-domain.com # Production client URL
```

### Development Setup
```bash
# Generate auth secret
openssl rand -base64 32

# Create .env.local file
cp .env.example .env.local

# Update with your values
nano .env.local
```

### Production Deployment
1. Update URLs to production domain
2. Ensure HTTPS is enabled
3. Configure MongoDB Atlas IP whitelist
4. Set secure environment variables
5. Enable cookie security flags

---

## 🔗 Integration Points

### Chat System Integration
```typescript
// Chat messages linked to users
interface ChatMessage {
  userId: string;               // Links to Better Auth user.id
  pluginName: string;
  message: string;
  response: string;
  // ... other fields
}

// Access user in chat API
const session = await auth.api.getSession({ headers: request.headers });
await DatabaseService.saveChatMessage({
  userId: session.user.id,
  pluginName,
  message,
  response,
  // ...
});
```

### Plugin System Integration
```typescript
// User plugins linked to users
interface UserPlugin {
  userId: string;               // Links to Better Auth user.id
  pluginName: string;
  status: 'pending' | 'compiling' | 'success' | 'failed';
  // ... other fields
}

// Access user in plugin API
const session = await auth.api.getSession({ headers: request.headers });
await DatabaseService.saveUserPlugin({
  userId: session.user.id,
  pluginName,
  status: 'pending',
  // ...
});
```

### Navigation Integration
```typescript
// User-aware navigation
function Navigation() {
  const { data: session } = useSession();
  
  return (
    <nav>
      {session ? (
        <UserMenu user={session.user} />
      ) : (
        <AuthButtons />
      )}
    </nav>
  );
}
```

### Role-Based Access Control
```typescript
// Check user roles
function AdminPanel() {
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser;
  
  if (user?.role !== 'admin') {
    return <div>Access denied</div>;
  }
  
  return <div>Admin content</div>;
}

// Server-side role checking
const session = await auth.api.getSession({ headers: request.headers });
const user = session.user as ExtendedUser;

if (user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## ❌ Error Handling

### Better Auth Error Codes
```typescript
const BASE_ERROR_CODES = {
  USER_NOT_FOUND: "User not found",
  FAILED_TO_CREATE_USER: "Failed to create user",
  FAILED_TO_CREATE_SESSION: "Failed to create session",
  FAILED_TO_UPDATE_USER: "Failed to update user",
  FAILED_TO_GET_SESSION: "Failed to get session",
  INVALID_PASSWORD: "Invalid password",
  INVALID_EMAIL: "Invalid email",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  USER_ALREADY_EXISTS: "User already exists",
  SESSION_EXPIRED: "Session expired. Re-authenticate to perform this action.",
  // ... more error codes
};
```

### Client-Side Error Handling
```typescript
// Sign in error handling
const result = await signIn.email({
  email: formData.email,
  password: formData.password,
});

if (result.error) {
  setError(result.error.message || 'Sign in failed');
} else {
  setSuccess('Successfully signed in!');
}

// Session error handling
const { data: session, error } = useSession();

if (error) {
  console.error('Session error:', error);
  // Handle session errors (e.g., redirect to sign-in)
}
```

### Server-Side Error Handling
```typescript
// API route error handling
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Handle request
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Common Error Scenarios
1. **Invalid Credentials**: Wrong email/password
2. **Expired Session**: Session timeout
3. **Network Errors**: Connection issues
4. **Validation Errors**: Invalid input data
5. **Permission Errors**: Insufficient access rights
6. **Database Errors**: Connection or query issues

---

## 🔧 Custom Extensions

### User Preferences System
```typescript
// Store user preferences as JSON
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
  };
  defaultPlugin: string;
}

// Save preferences
const preferences: UserPreferences = {
  theme: 'dark',
  language: 'en',
  notifications: { email: true, browser: false },
  defaultPlugin: 'minecraft-helper',
};

await fetch('/api/auth/update-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    preferences: JSON.stringify(preferences),
  }),
});

// Load preferences
const user = session.user as ExtendedUser;
const preferences = JSON.parse(user.preferences || '{}') as UserPreferences;
```

### Role-Based UI Components
```typescript
// Role-based component rendering
function RoleBasedContent({ allowedRoles, children }: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser;
  
  if (!user || !allowedRoles.includes(user.role || 'user')) {
    return null;
  }
  
  return <>{children}</>;
}

// Usage
<RoleBasedContent allowedRoles={['admin', 'moderator']}>
  <AdminControls />
</RoleBasedContent>
```

### User Activity Tracking
```typescript
// Track user activity
interface UserActivity {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata?: any;
}

// Log activity
async function logActivity(action: string, resource: string, metadata?: any) {
  const session = await getSession();
  if (!session) return;
  
  await fetch('/api/activity/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      resource,
      metadata,
    }),
  });
}

// Usage
await logActivity('plugin:create', 'minecraft-helper', { version: '1.0' });
await logActivity('chat:send', 'conversation-123', { messageLength: 150 });
```

---

## 🔧 Backend API Integration

### For External Backend Services

#### User Authentication Token
```typescript
// Get authentication token for external APIs
export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.session.token || null;
}

// Usage in external API calls
const token = await getAuthToken();
if (!token) {
  throw new Error('User not authenticated');
}

const response = await fetch('https://your-backend-api.com/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

#### User Context for Backend
```typescript
// Send user context to backend
interface UserContext {
  userId: string;
  email: string;
  role: string;
  displayName: string;
  sessionToken: string;
}

export async function getUserContext(): Promise<UserContext | null> {
  const session = await getSession();
  if (!session) return null;
  
  const user = session.user as ExtendedUser;
  
  return {
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
    displayName: user.displayName || user.name,
    sessionToken: session.session.token,
  };
}

// Backend API call with user context
async function callBackendAPI(endpoint: string, data: any) {
  const userContext = await getUserContext();
  if (!userContext) {
    throw new Error('Authentication required');
  }
  
  return fetch(`https://your-backend.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userContext.userId,
      'X-User-Role': userContext.role,
      'Authorization': `Bearer ${userContext.sessionToken}`,
    },
    body: JSON.stringify({
      ...data,
      userContext,
    }),
  });
}
```

#### Session Validation for Backend
```typescript
// Validate session token on backend API side
// (This would be implemented on your backend server)

// Example middleware for Express.js backend
app.use('/api/protected', async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Validate token with Pegasus Interface auth service
    const validation = await fetch(`${PEGASUS_AUTH_URL}/api/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!validation.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const sessionData = await validation.json();
    req.user = sessionData.user;
    req.session = sessionData.session;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token validation failed' });
  }
});
```

#### API Integration Patterns
```typescript
// 1. Proxy API Pattern - Route through Pegasus Interface
// File: src/app/api/backend/[...slug]/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  // Validate session
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Forward to backend with user context
  const backendUrl = `${process.env.BACKEND_API_URL}/${params.slug.join('/')}`;
  const body = await request.json();
  
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': session.user.id,
      'X-User-Email': session.user.email,
      'X-User-Role': (session.user as ExtendedUser).role || 'user',
    },
    body: JSON.stringify({
      ...body,
      userContext: {
        userId: session.user.id,
        email: session.user.email,
        role: (session.user as ExtendedUser).role || 'user',
      },
    }),
  });
  
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// 2. Direct Backend Integration Pattern
// Client-side service for backend calls
class BackendService {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    if (!session) {
      throw new Error('Authentication required');
    }
    
    const user = session.user as ExtendedUser;
    
    return {
      'Authorization': `Bearer ${session.session.token}`,
      'X-User-ID': user.id,
      'X-User-Role': user.role || 'user',
      'Content-Type': 'application/json',
    };
  }
  
  static async callAPI<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/auth/signin';
        throw new Error('Authentication required');
      }
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Specific API methods
  static async createPlugin(pluginData: any) {
    return this.callAPI('/plugins/create', pluginData);
  }
  
  static async getUserPlugins() {
    return this.callAPI('/plugins/user');
  }
  
  static async sendChatMessage(message: string, pluginName: string) {
    return this.callAPI('/chat/send', { message, pluginName });
  }
}

// Usage in components
async function handleCreatePlugin(data: any) {
  try {
    const result = await BackendService.createPlugin(data);
    console.log('Plugin created:', result);
  } catch (error) {
    console.error('Failed to create plugin:', error);
  }
}
```

---

## 🚀 Production Deployment Checklist

### Environment Configuration
- [ ] Set production MongoDB URI
- [ ] Generate secure `BETTER_AUTH_SECRET`
- [ ] Configure production domain URLs
- [ ] Set up GitHub OAuth (if needed)
- [ ] Enable HTTPS
- [ ] Configure CORS settings

### Security Hardening
- [ ] Enable MongoDB Atlas IP whitelisting
- [ ] Set up VPC peering (if applicable)
- [ ] Configure WAF rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategies

### Performance Optimization
- [ ] Enable MongoDB connection pooling
- [ ] Configure Redis for session storage (optional)
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression
- [ ] Configure caching headers

### Monitoring and Logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure application logs
- [ ] Monitor authentication metrics
- [ ] Set up uptime monitoring
- [ ] Configure alerts for failures

---

## 📞 Support and Troubleshooting

### Common Issues
1. **MongoDB Connection Issues**: Check URI format and network access
2. **Session Not Persisting**: Verify HTTPS and cookie settings
3. **OAuth Redirect Issues**: Check redirect URLs configuration
4. **Type Errors**: Use proper type casting for extended user fields
5. **CORS Issues**: Configure Next.js CORS settings

### Debug Tools
- Use browser dev tools to inspect cookies
- Check network tab for auth API calls
- Monitor console for auth errors
- Use MongoDB Compass for database inspection

### Documentation Links
- [Better Auth Documentation](https://www.better-auth.com)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [TypeScript Integration](https://www.typescriptlang.org/docs)

---

**This documentation provides a complete overview of the Pegasus Interface user system. Use this as a reference for backend API integration, customization, and troubleshooting.** 🎯
