import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/minecraft/servers/[id]/logs - Get server logs
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const level = searchParams.get('level') as 'info' | 'warn' | 'error' | 'debug' | null;
    const source = searchParams.get('source') as 'server' | 'plugin' | 'system' | null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined;
    
    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const options: any = { limit };
    if (level) options.level = level;
    if (source) options.source = source;
    if (since) options.since = since;    const logs = await DatabaseService.getServerLogs(serverId, options);

    // Also fetch recent Docker container logs if available
    let containerLogs: string[] = [];
    try {
      containerLogs = await DockerService.getContainerLogs(serverId, 50);
    } catch (dockerError) {
      console.error('Failed to fetch Docker logs:', dockerError);
      // Continue without Docker logs
    }

    return NextResponse.json({
      success: true,
      logs,
      containerLogs,
      filters: {
        level,
        source,
        limit,
        since
      }
    });
  } catch (error) {
    console.error('Error fetching server logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// POST /api/minecraft/servers/[id]/logs - Add log entry (for system use)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { level, message, source } = body;

    if (!level || !message) {
      return NextResponse.json({ 
        error: 'Level and message are required' 
      }, { status: 400 });
    }

    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate log level
    const validLevels = ['info', 'warn', 'error', 'debug'];
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
    }

    // Validate source
    const validSources = ['server', 'plugin', 'system'];
    const logSource = source || 'system';
    if (!validSources.includes(logSource)) {
      return NextResponse.json({ error: 'Invalid log source' }, { status: 400 });
    }

    await DatabaseService.logServerMessage(
      serverId,
      session.user.id,
      level,
      message,
      logSource
    );

    return NextResponse.json({
      success: true,
      message: 'Log entry added'
    });
  } catch (error) {
    console.error('Error adding server log:', error);
    return NextResponse.json(
      { error: 'Failed to add log entry' },
      { status: 500 }
    );
  }
}
