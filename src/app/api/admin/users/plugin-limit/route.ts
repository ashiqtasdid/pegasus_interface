import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../../../utils/cors';

/**
 * Admin API - Update user plugin limit
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

    const { userId, pluginLimit } = await request.json();

    if (!userId || typeof pluginLimit !== 'number') {
      return createCorsErrorResponse('User ID and plugin limit are required', 400);
    }

    if (pluginLimit < 0 || pluginLimit > 1000) {
      return createCorsErrorResponse('Plugin limit must be between 0 and 1000', 400);
    }

    await DatabaseService.updateUserPluginLimit(userId, pluginLimit);
    
    return createCorsResponse({
      success: true,
      message: 'Plugin limit updated successfully'
    });

  } catch (error) {
    console.error('Failed to update plugin limit:', error);
    return createCorsErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
