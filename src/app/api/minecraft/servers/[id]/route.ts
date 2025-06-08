import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/minecraft/servers/[id] - Get specific server details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const server = await DatabaseService.getMinecraftServer(serverId);

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get real-time Docker container status
    let containerStatus = server.status;
    let serverStats = null;
    try {
      const isHealthy = await DockerService.isContainerHealthy(serverId);
      containerStatus = isHealthy ? 'running' : 'stopped';
      
      if (isHealthy) {
        serverStats = await DockerService.getServerStats(serverId);
      }
    } catch (error) {
      console.error('Error checking Docker container status:', error);
      // Use database status as fallback
    }

    return NextResponse.json({
      success: true,
      server: {
        ...server,
        status: containerStatus,
        stats: serverStats
      }
    });
  } catch (error) {
    console.error('Error fetching minecraft server:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server' },
      { status: 500 }
    );
  }
}

// PATCH /api/minecraft/servers/[id] - Update server configuration
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update server configuration
    const allowedUpdates = ['serverName', 'maxPlayers', 'gameMode', 'difficulty', 'autoShutdown', 'inactiveShutdownMinutes'];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    await DatabaseService.updateMinecraftServerStatus(serverId, updates);

    await DatabaseService.logServerMessage(
      serverId,
      session.user.id,
      'info',
      `Server configuration updated: ${Object.keys(updates).join(', ')}`,
      'system'
    );

    return NextResponse.json({
      success: true,
      message: 'Server updated successfully'
    });
  } catch (error) {
    console.error('Error updating minecraft server:', error);
    return NextResponse.json(
      { error: 'Failed to update server' },
      { status: 500 }
    );
  }
}
