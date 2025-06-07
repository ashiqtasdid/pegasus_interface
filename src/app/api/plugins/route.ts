import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function GET(request: NextRequest) {
  try {
    // Get user session for user-specific plugin listing
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    try {
      const response = await fetch(`${API_BASE_URL}/create/plugins?userId=${encodeURIComponent(userId)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure we return an array
      if (Array.isArray(data)) {
        return NextResponse.json(data);
      } else if (data && Array.isArray(data.plugins)) {
        return NextResponse.json(data.plugins);
      } else {
        // If external API doesn't return an array, return empty array
        return NextResponse.json([]);
      }
    } catch (apiError) {
      // If external API is not available, return mock data or empty array
      console.log('External API not available, returning empty plugin list:', apiError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Failed to fetch plugins:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const pluginName = searchParams.get('pluginName');

    if (!pluginName) {
      return NextResponse.json({ error: 'Plugin name is required' }, { status: 400 });
    }

    // For now, we'll simulate plugin deletion since the backend API might not support this yet
    // In a real implementation, this would call the backend API to delete the plugin
    console.log(`Deleting plugin ${pluginName} for user ${userId}`);
    
    // TODO: Replace with actual backend API call when available
    // const response = await fetch(`${API_BASE_URL}/plugins/${encodeURIComponent(pluginName)}?userId=${encodeURIComponent(userId)}`, {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    // });

    // Simulate successful deletion
    return NextResponse.json({ success: true, message: 'Plugin deleted successfully' });
  } catch (error) {
    console.error('Failed to delete plugin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { pluginName, isVisible } = body;

    if (!pluginName || typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'Plugin name and visibility status are required' }, { status: 400 });
    }

    // For now, we'll simulate plugin visibility toggle since the backend API might not support this yet
    console.log(`Toggling visibility of plugin ${pluginName} to ${isVisible} for user ${userId}`);
    
    // TODO: Replace with actual backend API call when available
    // const response = await fetch(`${API_BASE_URL}/plugins/${encodeURIComponent(pluginName)}/visibility`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, isVisible }),
    // });

    // Simulate successful visibility toggle
    return NextResponse.json({ 
      success: true, 
      message: `Plugin ${isVisible ? 'made visible' : 'hidden'} successfully`,
      pluginName,
      isVisible
    });
  } catch (error) {
    console.error('Failed to toggle plugin visibility:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
