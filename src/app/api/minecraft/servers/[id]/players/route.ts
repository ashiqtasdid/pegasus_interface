import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/minecraft/servers/[id]/players - Get current players
export async function GET(request: NextRequest, { params }: Params) {
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
    }    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Try to get real-time player data from Docker container
    let realTimePlayers = null;
    try {
      if (server.status === 'running') {
        const response = await DockerService.executeCommand(serverId, 'list');
        const playerList = DockerService.parsePlayerList(response);
        realTimePlayers = {
          online: playerList,
          count: playerList.length,
          maxPlayers: server.maxPlayers,
          lastUpdated: new Date()
        };
      }
    } catch (dockerError) {
      console.error('Failed to fetch real-time player data:', dockerError);
      // Continue with database data
    }

    return NextResponse.json({
      success: true,
      players: realTimePlayers || {
        online: server.onlinePlayers || [],
        count: server.playerCount || 0,
        maxPlayers: server.maxPlayers,
        lastActivity: server.lastPlayerActivity
      }
    });
  } catch (error) {
    console.error('Error fetching server players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// PUT /api/minecraft/servers/[id]/players - Update player activity
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { playerCount, onlinePlayers } = body;

    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate input
    if (typeof playerCount !== 'number' || playerCount < 0) {
      return NextResponse.json({ error: 'Invalid player count' }, { status: 400 });
    }

    if (!Array.isArray(onlinePlayers)) {
      return NextResponse.json({ error: 'Invalid online players list' }, { status: 400 });
    }

    // Update player activity
    await DatabaseService.updateServerPlayerActivity(serverId, playerCount, onlinePlayers);

    // Log significant player changes
    const previousCount = server.playerCount || 0;
    if (playerCount !== previousCount) {
      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'info',
        `Player count changed: ${previousCount} → ${playerCount}`,
        'server'
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Player activity updated'
    });
  } catch (error) {
    console.error('Error updating server player activity:', error);
    return NextResponse.json(
      { error: 'Failed to update player activity' },
      { status: 500 }
    );
  }
}
