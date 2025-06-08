import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { MinecraftServerConfig } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

// GET /api/minecraft/servers - Get user's servers
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const servers = await DatabaseService.getUserMinecraftServers(session.user.id);
    
    return NextResponse.json({
      success: true,
      servers: servers
    });
  } catch (error) {
    console.error('Error fetching minecraft servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}

// POST /api/minecraft/servers - Create new server
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serverName, maxPlayers, gameMode, difficulty, memoryLimit, plugins } = body;

    if (!serverName) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 });
    }

    // Find available port
    const port = await DatabaseService.findAvailablePort(25565);

    const config: MinecraftServerConfig = {
      userId: session.user.id,
      serverName,
      port,
      maxPlayers: maxPlayers || 20,
      gameMode: gameMode || 'survival',
      difficulty: difficulty || 'normal',
      enableWhitelist: false,
      memoryLimit: memoryLimit || '2G',
      plugins: plugins || []
    };    const serverId = await DatabaseService.createMinecraftServer(config);
    
    // Create Docker container for the server
    try {
      const dockerOptions = {
        serverId,
        serverName: config.serverName,
        port: config.port,
        maxPlayers: config.maxPlayers || 20,
        gameMode: config.gameMode || 'survival',
        difficulty: config.difficulty || 'normal',
        memoryLimit: config.memoryLimit || '2G',
        plugins: config.plugins || []
      };
      
      await DockerService.createMinecraftServer(dockerOptions);
      console.log(`Docker container created for server ${serverId}`);
    } catch (dockerError) {
      console.error('Failed to create Docker container:', dockerError);
      // Continue without Docker container, but log the issue
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'warn',
        'Server created but Docker container failed to initialize',
        'system'
      );
    }
    
    // Log server creation
    await DatabaseService.logServerMessage(
      serverId,
      session.user.id,
      'info',
      `Server "${serverName}" created`,
      'system'
    );

    return NextResponse.json({
      success: true,
      serverId,
      message: 'Server created successfully'
    });
  } catch (error) {
    console.error('Error creating minecraft server:', error);
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}

// DELETE /api/minecraft/servers - Delete server (requires serverId in body)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }    // Stop server before deletion if running
    if (server.status === 'running') {
      try {
        await DockerService.stopContainer(serverId);
        await DatabaseService.stopMinecraftServer(serverId);
      } catch (error) {
        console.error('Error stopping server container:', error);
        // Continue with deletion even if stop fails
      }
    }

    // Remove Docker container
    try {
      await DockerService.removeContainer(serverId);
      console.log(`Docker container removed for server ${serverId}`);
    } catch (dockerError) {
      console.error('Failed to remove Docker container:', dockerError);
      // Continue with database deletion even if Docker cleanup fails
    }

    const deleted = await DatabaseService.deleteMinecraftServer(serverId);
    
    if (deleted) {
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'info',
        `Server "${server.serverName}" deleted`,
        'system'
      );

      return NextResponse.json({
        success: true,
        message: 'Server deleted successfully'
      });
    } else {
      return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting minecraft server:', error);
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}
