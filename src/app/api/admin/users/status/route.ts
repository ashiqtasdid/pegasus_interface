import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../../../utils/cors';

/**
 * Admin API - Update user status (active/inactive)
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

    const { userId, isActive } = await request.json();

    if (!userId || typeof isActive !== 'boolean') {
      return createCorsErrorResponse('User ID and status are required', 400);
    }

    await DatabaseService.updateUserStatus(userId, isActive);
    
    return createCorsResponse({
      success: true,
      message: 'User status updated successfully'
    });

  } catch (error) {
    console.error('Failed to update user status:', error);
    return createCorsErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
