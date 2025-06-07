import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json(mockPreferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();
    
    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // TODO: Store preferences in database
    console.log(`Updating preferences for user ${userId}:`, preferences);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
