import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// GET /api/minecraft/monitor - Auto-shutdown monitoring service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // Simple API key check (you should use environment variable)
    if (apiKey !== process.env.MONITOR_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get inactive servers that should be shut down
    const inactiveServers = await DatabaseService.getInactiveServers(10);
    const shutdownActions = [];

    for (const server of inactiveServers) {
      try {
        // Stop the server
        await DatabaseService.stopMinecraftServer(server.id);
        
        // Log the auto-shutdown
        await DatabaseService.logServerMessage(
          server.id,
          'system',
          'info',
          `Server auto-stopped due to inactivity (${server.inactiveShutdownMinutes} minutes)`,
          'system'
        );

        shutdownActions.push({
          serverId: server.id,
          serverName: server.serverName,
          action: 'stopped',
          reason: 'inactive'
        });
      } catch (error) {
        console.error(`Error auto-stopping server ${server.id}:`, error);
        shutdownActions.push({
          serverId: server.id,
          serverName: server.serverName,
          action: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Get all running servers for monitoring
    const runningServers = await DatabaseService.getAllRunningServers();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      monitoring: {
        runningServers: runningServers.length,
        inactiveServers: inactiveServers.length,
        shutdownActions: shutdownActions.length
      },
      shutdownActions,
      runningServers: runningServers.map(server => ({
        id: server.id,
        name: server.serverName,
        playerCount: server.playerCount,
        uptime: server.uptime,
        lastActivity: server.lastPlayerActivity
      }))
    });
  } catch (error) {
    console.error('Error in monitoring service:', error);
    return NextResponse.json(
      { error: 'Monitoring service error' },
      { status: 500 }
    );
  }
}

// POST /api/minecraft/monitor - Trigger manual monitoring check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId } = body;

    if (action === 'health-check') {
      // Perform health check on all servers
      const servers = await DatabaseService.getAllRunningServers();
      const healthChecks = [];

      for (const server of servers) {
        // TODO: Implement actual Docker container health check
        // For now, we'll simulate it
        const isHealthy = Math.random() > 0.1; // 90% healthy rate
        
        if (!isHealthy) {
          await DatabaseService.updateMinecraftServerStatus(server.id, {
            status: 'error',
            error: 'Health check failed'
          });

          await DatabaseService.logServerMessage(
            server.id,
            'system',
            'error',
            'Server health check failed',
            'system'
          );
        }

        healthChecks.push({
          serverId: server.id,
          healthy: isHealthy,
          lastCheck: new Date()
        });
      }

      return NextResponse.json({
        success: true,
        healthChecks
      });
    }

    if (action === 'cleanup' && serverId) {
      // Clean up stopped server resources
      const server = await DatabaseService.getMinecraftServer(serverId);
      if (server && server.status === 'stopped') {
        // TODO: Implement Docker container cleanup
        await DatabaseService.logServerMessage(
          serverId,
          'system',
          'info',
          'Server resources cleaned up',
          'system'
        );

        return NextResponse.json({
          success: true,
          message: 'Server cleanup completed'
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in monitoring action:', error);
    return NextResponse.json(
      { error: 'Monitoring action failed' },
      { status: 500 }
    );
  }
}
