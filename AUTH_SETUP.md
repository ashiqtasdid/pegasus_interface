# Authentication Setup Guide

This application uses **Better Auth** with MongoDB Atlas for user authentication and session management.

## Prerequisites

1. **MongoDB Atlas Account**: Sign up at [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Node.js**: Version 18 or higher
3. **pnpm**: Package manager

## Environment Setup

### 1. MongoDB Atlas Configuration

1. Create a new cluster in MongoDB Atlas
2. Create a database user with read/write permissions
3. Get your connection string from the "Connect" button
4. Replace the placeholder in `.env.local`:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pegasus-auth?retryWrites=true&w=majority
```

### 2. Authentication Secret

Generate a secure secret for Better Auth:

```bash
# Generate a random secret
openssl rand -base64 32
```

Update `.env.local`:
```bash
BETTER_AUTH_SECRET=your-generated-secret-here
```

### 3. Update URLs for Production

For production deployment, update these URLs in `.env.local`:
```bash
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_AUTH_URL=https://your-domain.com
```

## Database Schema

Better Auth will automatically create the necessary collections in MongoDB when first used. The collections include:

- `user` - User accounts and profiles
- `session` - User sessions
- `account` - OAuth accounts (if using social login)
- `verification` - Email verification tokens

## User Roles

The application supports role-based access control:

- **user** (default) - Standard user access
- **moderator** - Enhanced permissions
- **admin** - Full administrative access

Roles are assigned in the `user.role` field and can be managed through the admin interface.

## Features Implemented

### ✅ Core Authentication
- [x] Email/password sign up and sign in
- [x] User sessions with automatic renewal
- [x] Secure password hashing
- [x] Session management

### ✅ User Interface
- [x] Sign in/sign up forms with validation
- [x] User profile management
- [x] Navigation integration with auth state
- [x] Protected routes middleware

### ✅ User Profile
- [x] Display name customization
- [x] Role-based UI elements
- [x] Account information display
- [x] Profile editing capabilities

### ✅ Route Protection
- [x] Middleware for protected routes
- [x] Automatic redirects for unauthenticated users
- [x] Return URL handling after sign in

### ✅ Integration
- [x] Responsive design
- [x] Error handling and user feedback
- [x] TypeScript support
- [x] Consistent styling with existing UI

## API Endpoints

The authentication system provides these API endpoints:

- `POST /api/auth/sign-in` - User sign in
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User sign out
- `GET /api/auth/session` - Get current session
- `POST /api/auth/update-profile` - Update user profile

## Protected Routes

These routes require authentication:
- `/profile` - User profile page
- `/create` - Plugin creation (configurable)
- `/plugins` - User's plugins (configurable)

## Usage Examples

### Client-side Authentication Check
```typescript
import { useSession } from '@/lib/auth-client';

function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

### Server-side Authentication Check
```typescript
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Handle authenticated request
}
```

## Development

### Running the Application
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Database Testing
```bash
# Test database connection and schema
node setup-db.js
```

## Security Considerations

1. **Environment Variables**: Never commit real secrets to version control
2. **HTTPS**: Use HTTPS in production for secure cookie transmission
3. **Secret Rotation**: Regularly rotate the `BETTER_AUTH_SECRET`
4. **MongoDB Security**: Use MongoDB Atlas security features (IP whitelist, VPC peering)
5. **Session Security**: Sessions are httpOnly and secure by default

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify connection string format
   - Check database user permissions
   - Ensure IP address is whitelisted

2. **Session Not Persisting**
   - Check cookie settings
   - Verify HTTPS in production
   - Confirm `BETTER_AUTH_SECRET` is set

3. **Type Errors**
   - User extended fields use type casting: `(session.user as any).displayName`
   - This is due to Better Auth's type system limitations

### Getting Help

- Better Auth Documentation: [https://www.better-auth.com](https://www.better-auth.com)
- MongoDB Atlas Documentation: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- Next.js Documentation: [https://nextjs.org/docs](https://nextjs.org/docs)

## Next Steps

1. Set up your MongoDB Atlas cluster
2. Update environment variables
3. Test the authentication flow
4. Customize user roles and permissions as needed
5. Deploy to production with proper HTTPS configuration
