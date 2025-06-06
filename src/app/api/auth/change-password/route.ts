import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Change user password API route
 * POST /api/auth/change-password
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session using the request
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Change password
    const result = await auth.api.changePassword({
      headers: request.headers,
      body: {
        currentPassword,
        newPassword,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Password change failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error changing password:', error);
    
    // Return error message from Better Auth if available
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}