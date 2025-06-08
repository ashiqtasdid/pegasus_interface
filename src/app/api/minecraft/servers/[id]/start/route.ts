import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/minecraft/servers/[id]/start - Start server
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });    }

    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check current status
    if (server.status === 'running') {
      return NextResponse.json({ error: 'Server is already running' }, { status: 400 });
    }

    if (server.status === 'starting') {
      return NextResponse.json({ error: 'Server is already starting' }, { status: 400 });
    }    // Start the server using Docker
    try {
      await DockerService.startContainer(serverId);
      
      // Update database status
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'running',
        lastSeen: new Date()
      });

      // Log the successful start
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'info',
        `Server "${server.serverName}" started successfully`,
        'system'
      );

      return NextResponse.json({
        success: true,
        message: 'Server started successfully'
      });
    } catch (dockerError) {
      console.error('Docker start error:', dockerError);
      
      // Update database with error status
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'error',
        error: 'Failed to start Docker container'
      });
      
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'error',
        `Failed to start server: ${dockerError}`,
        'system'
      );

      return NextResponse.json(
        { error: 'Failed to start server container' },
        { status: 500 }
      );
    }  } catch (error) {
    console.error('Error starting minecraft server:', error);
    
    // Log the error
    try {
      const { id: serverId } = await params;
      await DatabaseService.updateMinecraftServerStatus(serverId, {
        status: 'error',
        error: 'Failed to start server'
      });
      
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      
      await DatabaseService.logServerMessage(
        serverId,
        session?.user?.id || '',
        'error',
        `Failed to start server: ${error}`,
        'system'
      );
    } catch (logError) {
      console.error('Error logging server start failure:', logError);
    }

    return NextResponse.json(
      { error: 'Failed to start server' },
      { status: 500 }
    );
  }
}
