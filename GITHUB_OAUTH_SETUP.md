# GitHub OAuth Setup Guide

## Overview
This guide will help you set up GitHub OAuth authentication for your Pegasus Nest application.

## Prerequisites
- A GitHub account
- Access to your application's environment variables

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Developer Settings**:
   - Visit: https://github.com/settings/applications/new
   - Or go to: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App

2. **Fill out the OAuth App form**:
   ```
   Application Name: Pegasus Nest
   Homepage URL: http://localhost:3000
   Application description: AI-powered plugin development platform
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```

3. **Create the application**
   - Click "Register application"

4. **Get your credentials**:
   - After creation, you'll see your `Client ID` and can generate a `Client Secret`
   - **Important**: Copy the Client Secret immediately as it won't be shown again

## Step 2: Update Environment Variables

Update your `.env.local` file with the GitHub OAuth credentials:

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-actual-github-client-id-here
GITHUB_CLIENT_SECRET=your-actual-github-client-secret-here
```

## Step 3: Production Setup

For production deployment, you'll need to:

1. **Create a separate GitHub OAuth App for production**:
   - Use your production domain instead of localhost
   - Example callback URL: `https://yourapp.com/api/auth/callback/github`

2. **Update production environment variables**:
   ```bash
   GITHUB_CLIENT_ID=your-production-github-client-id
   GITHUB_CLIENT_SECRET=your-production-github-client-secret
   BETTER_AUTH_URL=https://yourapp.com
   NEXT_PUBLIC_AUTH_URL=https://yourapp.com
   ```

## Step 4: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test GitHub sign-in**:
   - Go to http://localhost:3000/auth/signin
   - Click "Continue with GitHub"
   - You should be redirected to GitHub for authorization
   - After authorization, you'll be redirected back to your app

## Features Enabled

With GitHub OAuth integration, users can:
- Sign in with their GitHub account
- Sign up with their GitHub account (creates a new user record)
- Access their GitHub profile information
- Have their GitHub profile picture as their avatar

## Security Notes

- Never commit your `GITHUB_CLIENT_SECRET` to version control
- Use different OAuth apps for development and production
- The client secret should be kept secure and only used on the server side
- Better Auth handles the OAuth flow securely and stores only necessary user information

## Troubleshooting

### Common Issues:

1. **"OAuth App not found" error**:
   - Check that your Client ID is correct
   - Ensure the OAuth app exists in your GitHub account

2. **"Redirect URI mismatch" error**:
   - Verify the callback URL in your GitHub OAuth app matches exactly
   - For localhost: `http://localhost:3000/api/auth/callback/github`

3. **"Invalid client secret" error**:
   - Regenerate the client secret in GitHub
   - Update your environment variables
   - Restart your development server

4. **User not being created**:
   - Check your MongoDB connection
   - Ensure the database schema is set up correctly
   - Run the database setup script if needed: `node setup-db.js`

## Next Steps

After setting up GitHub OAuth:
- Users can sign in with either email/password or GitHub
- Consider adding more OAuth providers (Google, Discord, etc.)
- Implement role-based permissions for different user types
- Add user profile customization features
