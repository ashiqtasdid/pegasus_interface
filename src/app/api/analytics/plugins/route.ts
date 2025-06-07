import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';

/**
 * Enhanced Plugin Analytics API Route
 * Provides detailed analytics for individual plugins
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    const pluginId = searchParams.get('pluginId');
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    if (pluginId) {
      // Get analytics for specific plugin
      const plugin = await DatabaseService.getPluginById(pluginId, userId);
      if (!plugin) {
        return NextResponse.json(
          { error: 'Plugin not found or access denied' },
          { status: 404 }
        );
      }

      const analytics = await DatabaseService.getPluginAnalyticsSummary(pluginId, days);
      const reviews = await DatabaseService.getPluginReviews(pluginId, { 
        status: 'approved',
        limit: 10,
        sortBy: 'newest'
      });

      return NextResponse.json({
        success: true,
        pluginId,
        plugin: {
          id: plugin.pluginId,
          name: plugin.displayName,
          category: plugin.category,
          status: plugin.status,
          visibility: plugin.visibility
        },
        analytics: {
          summary: analytics,
          period: `${days} days`,
          currentStats: {
            downloadCount: plugin.analytics?.downloadCount || 0,
            viewCount: plugin.analytics?.viewCount || 0,
            averageRating: plugin.analytics?.averageRating || 0,
            reviewCount: plugin.analytics?.reviewCount || 0
          }
        },
        reviews: reviews.slice(0, 5)
      });
    } else {
      // Get overview analytics for all user plugins
      const plugins = await DatabaseService.getUserPlugins(userId);
      const userSummary = await DatabaseService.getUserAnalyticsSummary(userId);

      const pluginStats = await Promise.all(
        plugins.slice(0, 10).map(async (plugin) => {
          const analytics = await DatabaseService.getPluginAnalyticsSummary(plugin.pluginId, 7);
          return {
            pluginId: plugin.pluginId,
            pluginName: plugin.displayName,
            category: plugin.category,
            status: plugin.status,
            totalDownloads: plugin.analytics?.downloadCount || 0,
            totalViews: plugin.analytics?.viewCount || 0,
            averageRating: plugin.analytics?.averageRating || 0,
            recentActivity: analytics,
            createdAt: plugin.createdAt,
            lastModified: plugin.lastModified
          };
        })
      );

      return NextResponse.json({
        success: true,
        overview: userSummary,
        pluginStats,
        totalPlugins: plugins.length
      });
    }

  } catch (error) {
    console.error('Failed to fetch plugin analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { pluginId, action, metadata } = await request.json();

    if (!pluginId || !action) {
      return NextResponse.json(
        { error: 'Plugin ID and action are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Update analytics based on action
    const updates: Record<string, number> = {};
    
    switch (action) {
      case 'view':
        updates.views = 1;
        break;
      case 'download':
        updates.downloads = 1;
        await DatabaseService.incrementPluginDownload(pluginId, userId);
        break;
      case 'install':
        updates.installs = 1;
        break;
      case 'uninstall':
        updates.uninstalls = 1;
        break;
      case 'compile_success':
        updates.successfulCompilations = 1;
        break;
      case 'compile_error':
        updates.failedCompilations = 1;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Add performance metrics if provided
    if (metadata?.loadTime) {
      updates.averageLoadTime = metadata.loadTime;
    }
    if (metadata?.executionTime) {
      updates.averageExecutionTime = metadata.executionTime;
    }

    await DatabaseService.updatePluginAnalytics(pluginId, today, updates);

    // Log user activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'plugin_downloaded',
      action: `plugin_${action}`,
      description: `Performed ${action} on plugin`,
      pluginId,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined,
        ...metadata
      }
    });

    return NextResponse.json({
      success: true,
      message: `Plugin ${action} recorded`,
      pluginId,
      action
    });

  } catch (error) {
    console.error('Failed to record plugin analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
