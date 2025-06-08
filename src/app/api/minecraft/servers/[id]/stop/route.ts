import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/minecraft/servers/[id]/stop - Stop server
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

    // Check current status
    if (server.status === 'stopped') {
      return NextResponse.json({ error: 'Server is already stopped' }, { status: 400 });
    }

    if (server.status === 'stopping') {
      return NextResponse.json({ error: 'Server is already stopping' }, { status: 400 });
    }    // Stop the server using Docker
    try {
      await DockerService.stopContainer(serverId);
      
      // Update database status
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'stopped',
        playerCount: 0,
        onlinePlayers: [],
        lastSeen: new Date()
      });

      // Log the successful stop
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'info',
        `Server "${server.serverName}" stopped successfully`,
        'system'
      );

      return NextResponse.json({
        success: true,
        message: 'Server stopped successfully'
      });
    } catch (dockerError) {
      console.error('Docker stop error:', dockerError);
      
      // Update database with error status
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'error',
        error: 'Failed to stop Docker container'
      });
      
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'error',
        `Failed to stop server: ${dockerError}`,
        'system'
      );

      return NextResponse.json(
        { error: 'Failed to stop server container' },
        { status: 500 }
      );
    }  } catch (error) {
    console.error('Error stopping minecraft server:', error);
    
    // Log the error
    try {
      const { id: serverId } = await params;
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'error',
        error: 'Failed to stop server'
      });
      
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      await DatabaseService.logServerMessage(
        serverId,
        session?.user?.id || '',
        'error',
        `Failed to stop server: ${error}`,
        'system'
      );
    } catch (logError) {
      console.error('Error logging server stop failure:', logError);
    }

    return NextResponse.json(
      { error: 'Failed to stop server' },
      { status: 500 }
    );
  }
}
