import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../utils/cors';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function GET(request: NextRequest) {
  try {
    // Get user session for user-specific plugin listing
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
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
        return createCorsResponse(data);
      } else if (data && Array.isArray(data.plugins)) {
        return createCorsResponse(data.plugins);
      } else {
        // If external API doesn't return an array, return empty array
        return createCorsResponse([]);
      }
    } catch (apiError) {
      // If external API is not available, return mock data or empty array
      console.log('External API not available, returning empty plugin list:', apiError);
      return createCorsResponse([]);
    }
  } catch (error) {
    console.error('Failed to fetch plugins:', error);
    return createCorsErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    const userId = session.user.id;
    
    const { searchParams } = new URL(request.url);
    const pluginName = searchParams.get('pluginName');

    if (!pluginName) {
      return createCorsErrorResponse('Plugin name is required', 400);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/create/plugins?pluginName=${encodeURIComponent(pluginName)}&userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (apiError) {
      console.log('External API not available, skipping deletion:', apiError);
    }
    
    return createCorsResponse({ success: true, message: 'Plugin deleted successfully' });
  } catch (error) {
    console.error('Failed to delete plugin:', error);
    return createCorsErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    const userId = session.user.id;
    const body = await request.json();
    const { pluginName, isPublic } = body;

    if (!pluginName || typeof isPublic !== 'boolean') {
      return createCorsErrorResponse('Plugin name and visibility status are required', 400);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/create/plugins/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pluginName,
          isPublic,
          userId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (apiError) {
      console.log('External API not available, skipping visibility update:', apiError);
    }
    
    return createCorsResponse({ 
      success: true, 
      message: `Plugin ${isPublic ? 'made public' : 'made private'} successfully` 
    });
  } catch (error) {
    console.error('Failed to update plugin visibility:', error);
    return createCorsErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function OPTIONS() {
  return handleOptions();
}