import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../../../utils/cors';

/**
 * Admin API - Update user role
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return createCorsErrorResponse('Admin access required', 403);
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return createCorsErrorResponse('User ID and role are required', 400);
    }

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return createCorsErrorResponse('Invalid role', 400);
    }

    await DatabaseService.updateUserRole(userId, role);
    
    return createCorsResponse({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Failed to update user role:', error);
    return createCorsErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
