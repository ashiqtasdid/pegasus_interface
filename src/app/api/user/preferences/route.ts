import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../../utils/cors';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    // TODO: Fetch from database
    // For now, return default preferences or mock stored preferences
    const mockPreferences = {
      theme: 'system',
      chatSettings: {
        autoSave: true,
        maxHistoryDays: 30,
        enableNotifications: true,
        defaultModel: 'gpt-4',
      },
      pluginSettings: {
        autoCompile: true,
        maxPlugins: 10,
        defaultPrivacy: 'private',
        enableAnalytics: true,
      },
      uiSettings: {
        sidebarCollapsed: false,
        showAdvancedOptions: false,
        compactMode: false,
        language: 'en',
      },
    };

    return createCorsResponse(mockPreferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return createCorsErrorResponse('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    const preferences = await request.json();
    
    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return createCorsErrorResponse('Invalid preferences format', 400);
    }

    const userId = session.user.id;

    // TODO: Store preferences in database
    console.log(`Updating preferences for user ${userId}:`, preferences);

    return createCorsResponse({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return createCorsErrorResponse('Internal server error');
  }
}

export async function OPTIONS() {
  return handleOptions();
}
