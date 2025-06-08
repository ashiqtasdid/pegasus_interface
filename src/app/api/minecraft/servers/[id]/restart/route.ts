import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/minecraft/servers/[id]/restart - Restart server
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,    });
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
    }

    // Check if server can be restarted
    if (server.status === 'starting' || server.status === 'stopping') {
      return NextResponse.json({ 
        error: `Cannot restart server while it is ${server.status}` 
      }, { status: 400 });
    }    // Restart the server using Docker
    try {
      await DockerService.restartContainer(serverId);
      
      // Update database status
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'running',
        lastSeen: new Date()
      });

      // Log the successful restart
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'info',
        `Server "${server.serverName}" restarted successfully`,
        'system'
      );

      return NextResponse.json({
        success: true,
        message: 'Server restarted successfully'
      });
    } catch (dockerError) {
      console.error('Docker restart error:', dockerError);
      
      // Update database with error status
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'error',
        error: 'Failed to restart Docker container'
      });
      
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'error',
        `Failed to restart server: ${dockerError}`,
        'system'
      );

      return NextResponse.json(
        { error: 'Failed to restart server container' },
        { status: 500 }
      );
    }  } catch (error) {
    console.error('Error restarting minecraft server:', error);
    
    // Log the error
    try {
      const { id: serverId } = await params;
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'error',
        error: 'Failed to restart server'
      });
      
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      await DatabaseService.logServerMessage(
        serverId,
        session?.user?.id || '',
        'error',
        `Failed to restart server: ${error}`,
        'system'
      );
    } catch (logError) {
      console.error('Error logging server restart failure:', logError);
    }

    return NextResponse.json(
      { error: 'Failed to restart server' },
      { status: 500 }
    );
  }
}
