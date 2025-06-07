import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';

/**
 * User Analytics API Route
 * Provides comprehensive user analytics and insights
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type'); // 'summary' | 'activity' | 'plugins'
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    switch (type) {
      case 'summary':
        const summary = await DatabaseService.getUserAnalyticsSummary(userId);
        return NextResponse.json({
          success: true,
          type: 'summary',
          data: summary
        });

      case 'activity':
        const activities = await DatabaseService.getUserActivities(userId, {
          days,
          limit
        });
        return NextResponse.json({
          success: true,
          type: 'activity',
          data: activities,
          count: activities.length
        });

      case 'plugins':
        const plugins = await DatabaseService.getUserPlugins(userId, {
          limit,
          sortBy: '-analytics.downloadCount'
        });
        return NextResponse.json({
          success: true,
          type: 'plugins',
          data: plugins,
          count: plugins.length
        });

      default:
        // Return comprehensive analytics
        const [analyticsSummary, recentActivities, topPlugins] = await Promise.all([
          DatabaseService.getUserAnalyticsSummary(userId),
          DatabaseService.getUserActivities(userId, { days: 7, limit: 20 }),
          DatabaseService.getUserPlugins(userId, { limit: 5, sortBy: '-analytics.downloadCount' })
        ]);

        return NextResponse.json({
          success: true,
          data: {
            summary: analyticsSummary,
            recentActivity: recentActivities,
            topPlugins: topPlugins,
            period: `${days} days`
          }
        });
    }

  } catch (error) {
    console.error('Failed to fetch user analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
