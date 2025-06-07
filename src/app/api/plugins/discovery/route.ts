import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, UserPlugin } from '../../../../lib/database';
import { auth } from '../../../../lib/auth';

// GET /api/plugins/discovery - Plugin discovery with various algorithms
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'trending'; // trending, featured, recommended, new, popular
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    let plugins: UserPlugin[] = [];

    switch (type) {
      case 'trending':
        plugins = await DatabaseService.getTrendingPlugins(limit);
        break;
      
      case 'featured':
        plugins = await DatabaseService.getFeaturedPlugins(limit);
        break;
      
      case 'recommended':
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (session?.user?.email) {
          const user = await DatabaseService.getUserByEmail(session.user.email);
          if (user) {
            plugins = await DatabaseService.getRecommendedPlugins(user._id.toString(), limit);
          }
        }
        // Fallback to featured if no user or no recommendations
        if (plugins.length === 0) {
          plugins = await DatabaseService.getFeaturedPlugins(limit);
        }
        break;
      
      case 'new':
        plugins = await DatabaseService.getNewPlugins(limit);
        break;
      
      case 'popular':
        plugins = await DatabaseService.getPopularPlugins(limit);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid discovery type' }, { status: 400 });
    }

    // Filter by category if specified
    if (category && plugins.length > 0) {
      plugins = plugins.filter(plugin =>
        plugin.category === category || (plugin.tags && Array.isArray(plugin.tags) && plugin.tags.includes(category))
      );
    }

    return NextResponse.json({ plugins, type, category, total: plugins.length });
  } catch (error) {
    console.error('Error in plugin discovery:', error);
    return NextResponse.json(
      { error: 'Failed to discover plugins' },
      { status: 500 }
    );
  }
}

// POST /api/plugins/discovery - Track discovery interactions
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { pluginId, action, metadata } = await request.json();

    if (!pluginId || !action) {
      return NextResponse.json(
        { error: 'pluginId and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['view', 'click', 'install', 'bookmark', 'share'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if plugin exists
    const plugin = await DatabaseService.getPluginById(pluginId);
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    let userId = null;
    if (session?.user?.email) {
      const user = await DatabaseService.getUserByEmail(session.user.email);
      userId = user?._id?.toString() || null;
    }

    // Log user activity
    if (userId) {
      await DatabaseService.logUserActivity(
        userId,
        'plugin',
        action,
        pluginId,
        { source: 'discovery', ...metadata }
      );
    }

    // Record analytics based on action
    switch (action) {
      case 'view':
        await DatabaseService.recordPluginAnalytics(pluginId, 'view', 1);
        break;
      case 'click':
        await DatabaseService.recordPluginAnalytics(pluginId, 'click', 1);
        break;
      case 'install':
        await DatabaseService.recordPluginAnalytics(pluginId, 'install', 1);
        // Also increment user stats
        if (userId) {
          await DatabaseService.incrementUserStat(userId, 'totalDownloads', 1);
        }
        break;
      case 'bookmark':
      case 'share':
        // These are tracked in user activity only
        break;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${action} interaction recorded for plugin ${pluginId}` 
    });
  } catch (error) {
    console.error('Error recording discovery interaction:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction' },
      { status: 500 }
    );
  }
}
