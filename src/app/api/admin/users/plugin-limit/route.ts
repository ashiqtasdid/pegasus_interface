import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';

/**
 * Admin API - Update user plugin limit
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, pluginLimit } = await request.json();

    if (!userId || typeof pluginLimit !== 'number') {
      return NextResponse.json({ error: 'User ID and plugin limit are required' }, { status: 400 });
    }

    if (pluginLimit < 0 || pluginLimit > 1000) {
      return NextResponse.json({ error: 'Plugin limit must be between 0 and 1000' }, { status: 400 });
    }

    await DatabaseService.updateUserPluginLimit(userId, pluginLimit);
    
    return NextResponse.json({
      success: true,
      message: 'Plugin limit updated successfully'
    });

  } catch (error) {
    console.error('Failed to update plugin limit:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
