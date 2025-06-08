import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { DockerService } from '@/lib/docker-service';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/minecraft/servers/[id]/command - Get recent commands
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: serverId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const commands = await DatabaseService.getServerCommands(serverId, limit);

    return NextResponse.json({
      success: true,
      commands
    });
  } catch (error) {
    console.error('Error fetching server commands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commands' },
      { status: 500 }
    );
  }
}

// POST /api/minecraft/servers/[id]/command - Execute command
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
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Valid command is required' }, { status: 400 });
    }

    // Verify ownership
    const server = await DatabaseService.getMinecraftServer(serverId);
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if server is running
    if (server.status !== 'running') {
      return NextResponse.json({ 
        error: 'Server must be running to execute commands' 
      }, { status: 400 });
    }

    // Validate command (basic security)
    const sanitizedCommand = command.trim();
    if (sanitizedCommand.length === 0) {
      return NextResponse.json({ error: 'Command cannot be empty' }, { status: 400 });
    }

    // Prevent dangerous commands
    const dangerousCommands = ['stop', 'shutdown', 'restart', 'kill'];
    const commandWord = sanitizedCommand.split(' ')[0].toLowerCase();
    if (dangerousCommands.includes(commandWord)) {
      return NextResponse.json({ 
        error: 'Use the dedicated endpoints for server control commands' 
      }, { status: 400 });
    }

    // Execute the command
    const commandId = await DatabaseService.executeServerCommand(
      serverId,
      session.user.id,
      sanitizedCommand
    );    // Execute the command using Docker
    try {
      const startTime = Date.now();
      const response = await DockerService.executeCommand(serverId, sanitizedCommand);
      const executionTime = Date.now() - startTime;

      // Update command status with response
      const commandsCollection = await DatabaseService.getMinecraftServerCommandsCollection();
      await commandsCollection.updateOne(
        { _id: commandId },
        { 
          $set: { 
            status: 'executed',
            response,
            executionTime
          } 
        }
      );

      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'info',
        `Command response: ${response}`,
        'system'
      );

      return NextResponse.json({
        success: true,
        commandId,
        response,
        executionTime,
        message: 'Command executed successfully'
      });
    } catch (dockerError) {
      console.error('Docker command execution error:', dockerError);
      
      // Update command status with error
      const commandsCollection = await DatabaseService.getMinecraftServerCommandsCollection();
      await commandsCollection.updateOne(
        { _id: commandId },
        { 
          $set: { 
            status: 'failed',
            response: `Error: ${dockerError}`
          } 
        }
      );

      await DatabaseService.logServerMessage(
        serverId,
        session.user.id,
        'error',
        `Command failed: ${dockerError}`,
        'system'
      );

      return NextResponse.json(
        { error: 'Failed to execute command on server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error executing server command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    );
  }
}
