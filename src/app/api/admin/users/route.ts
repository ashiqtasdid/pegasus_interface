import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../../utils/cors';

/**
 * Admin Users API - Get all users for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return createCorsErrorResponse('Admin access required', 403);
    }

    const users = await DatabaseService.getAllUsersForAdmin();
    
    return createCorsResponse({
      success: true,
      users
    });

  } catch (error) {
    console.error('Failed to fetch users for admin:', error);
    return createCorsErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
