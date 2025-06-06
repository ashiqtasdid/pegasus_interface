import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const plugins = await DatabaseService.getUserPlugins(session.user.id);
    return NextResponse.json({ success: true, plugins });

  } catch (error) {
    console.error('Failed to get user plugins:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Validate MongoDB connection
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in environment variables');
      return NextResponse.json({
        success: false,
        error: 'Database configuration error'
      }, { status: 500 });
    }

    const body = await request.json();
    const { pluginName, pluginData, status } = body;

    if (!pluginName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plugin name is required' 
      }, { status: 400 });
    }

    const pluginId = await DatabaseService.saveUserPlugin({
      userId: session.user.id,
      pluginName,
      pluginData: pluginData ? JSON.stringify(pluginData) : undefined,
      status: status || 'pending',
      downloadCount: 0,
    });

    return NextResponse.json({ success: true, pluginId });

  } catch (error) {
    console.error('Failed to save user plugin:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
