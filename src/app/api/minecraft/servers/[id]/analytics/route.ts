import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/minecraft/servers/[id]/analytics - Get server analytics
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }    const analytics = await DatabaseService.getServerAnalytics(serverId);

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not available' }, { status: 404 });
    }

    // Get real-time Docker container statistics
    let containerStats = null;
    try {
      containerStats = await DockerService.getServerStats(serverId);
    } catch (dockerError) {
      console.error('Failed to fetch Docker stats:', dockerError);
      // Continue without Docker stats
    }

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        realTimeStats: containerStats
      }
    });
  } catch (error) {
    console.error('Error fetching server analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
