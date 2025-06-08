import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

// GET /api/minecraft/admin - Get all servers (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    // TODO: Implement proper admin role checking
    // const user = await DatabaseService.getUserById(session.user.id);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;

    let servers;
    if (status) {
      servers = await DatabaseService.getServersByStatus(status);
    } else {
      servers = await DatabaseService.getAllRunningServers();
    }

    // Get inactive servers for auto-shutdown monitoring
    const inactiveServers = await DatabaseService.getInactiveServers(10);

    return NextResponse.json({
      success: true,
      servers,
      inactiveServers: inactiveServers.length,
      statistics: {
        total: servers.length,
        byStatus: servers.reduce((acc: any, server) => {
          acc[server.status] = (acc[server.status] || 0) + 1;
          return acc;
        }, {}),
        totalPlayers: servers.reduce((sum, server) => sum + server.playerCount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching admin server data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server data' },
      { status: 500 }
    );
  }
}

// POST /api/minecraft/admin - Admin server actions
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    // TODO: Implement proper admin role checking
    // const user = await DatabaseService.getUserById(session.user.id);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const body = await request.json();
    const { action, serverId } = body;

    if (!action || !serverId) {
      return NextResponse.json({ 
        error: 'Action and server ID are required' 
      }, { status: 400 });
    }

    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }    switch (action) {
      case 'force-stop':
        try {
          // Force stop using Docker service
          await DockerService.stopContainer(serverId);
          await DatabaseService.stopMinecraftServer(serverId);
          await DatabaseService.logServerMessage(
            serverId,
            session.user.id,
            'warn',
            'Server force-stopped by admin',
            'system'
          );
        } catch (error) {
          console.error('Error force-stopping server:', error);
          // Still update database even if Docker operation fails
          await DatabaseService.stopMinecraftServer(serverId);
          await DatabaseService.logServerMessage(
            serverId,
            session.user.id,
            'error',
            `Force-stop attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'system'
          );
        }
        break;

      case 'force-restart':
        try {
          // Force restart using Docker service
          await DockerService.restartContainer(serverId);
          await DatabaseService.restartMinecraftServer(serverId);
          await DatabaseService.logServerMessage(
            serverId,
            session.user.id,
            'warn',
            'Server force-restarted by admin',
            'system'
          );
        } catch (error) {
          console.error('Error force-restarting server:', error);
          // Still update database even if Docker operation fails
          await DatabaseService.restartMinecraftServer(serverId);
          await DatabaseService.logServerMessage(
            serverId,
            session.user.id,
            'error',
            `Force-restart attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'system'
          );
        }
        break;

      case 'enable-auto-shutdown':
        await DatabaseService.updateAutoShutdownSettings(serverId, {
          enabled: true,
          inactiveMinutes: 10
        });
        await DatabaseService.logServerMessage(
          serverId,
          session.user.id,
          'info',
          'Auto-shutdown enabled by admin',
          'system'
        );
        break;

      case 'disable-auto-shutdown':
        await DatabaseService.updateAutoShutdownSettings(serverId, {
          enabled: false,
          inactiveMinutes: 10
        });
        await DatabaseService.logServerMessage(
          serverId,
          session.user.id,
          'info',
          'Auto-shutdown disabled by admin',
          'system'
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Action "${action}" executed successfully`
    });
  } catch (error) {
    console.error('Error executing admin action:', error);
    return NextResponse.json(
      { error: 'Failed to execute admin action' },
      { status: 500 }
    );
  }
}
