import { NextRequest, NextResponse } from 'next/server';

// Mock detailed historical data for specific services
const serviceHistoryData = {
  database: {
    trend: 'stable',
    historyCount: 24,
    recentHistory: [
      { timestamp: '2024-12-06T09:00:00.000Z', status: 'up' as const, responseTime: 10, errorCount: 0 },
      { timestamp: '2024-12-06T08:00:00.000Z', status: 'up' as const, responseTime: 12, errorCount: 0 },
      { timestamp: '2024-12-06T07:00:00.000Z', status: 'up' as const, responseTime: 11, errorCount: 0 },
      { timestamp: '2024-12-06T06:00:00.000Z', status: 'up' as const, responseTime: 13, errorCount: 0 },
      { timestamp: '2024-12-06T05:00:00.000Z', status: 'up' as const, responseTime: 9, errorCount: 0 }
    ]
  },
  'external-api': {
    trend: 'improving',
    historyCount: 24,
    recentHistory: [
      { timestamp: '2024-12-06T09:00:00.000Z', status: 'up' as const, responseTime: 40, errorCount: 0 },
      { timestamp: '2024-12-06T08:00:00.000Z', status: 'up' as const, responseTime: 45, errorCount: 1 },
      { timestamp: '2024-12-06T07:00:00.000Z', status: 'up' as const, responseTime: 50, errorCount: 2 },
      { timestamp: '2024-12-06T06:00:00.000Z', status: 'down' as const, responseTime: 0, errorCount: 5 },
      { timestamp: '2024-12-06T05:00:00.000Z', status: 'up' as const, responseTime: 55, errorCount: 1 }
    ]
  },
  'auth-service': {
    trend: 'stable',
    historyCount: 24,
    recentHistory: [
      { timestamp: '2024-12-06T09:00:00.000Z', status: 'up' as const, responseTime: 8, errorCount: 0 },
      { timestamp: '2024-12-06T08:00:00.000Z', status: 'up' as const, responseTime: 7, errorCount: 0 },
      { timestamp: '2024-12-06T07:00:00.000Z', status: 'up' as const, responseTime: 9, errorCount: 0 },
      { timestamp: '2024-12-06T06:00:00.000Z', status: 'up' as const, responseTime: 8, errorCount: 0 },
      { timestamp: '2024-12-06T05:00:00.000Z', status: 'up' as const, responseTime: 6, errorCount: 0 }
    ]
  },
  'gemini-ai': {
    trend: 'degrading',
    historyCount: 24,
    recentHistory: [
      { timestamp: '2024-12-06T09:00:00.000Z', status: 'up' as const, responseTime: 150, errorCount: 2 },
      { timestamp: '2024-12-06T08:00:00.000Z', status: 'up' as const, responseTime: 120, errorCount: 1 },
      { timestamp: '2024-12-06T07:00:00.000Z', status: 'up' as const, responseTime: 110, errorCount: 0 },
      { timestamp: '2024-12-06T06:00:00.000Z', status: 'up' as const, responseTime: 95, errorCount: 0 },
      { timestamp: '2024-12-06T05:00:00.000Z', status: 'up' as const, responseTime: 85, errorCount: 0 }
    ]
  },
  'compiler-service': {
    trend: 'stable',
    historyCount: 24,
    recentHistory: [
      { timestamp: '2024-12-06T09:00:00.000Z', status: 'up' as const, responseTime: 80, errorCount: 0 },
      { timestamp: '2024-12-06T08:00:00.000Z', status: 'up' as const, responseTime: 85, errorCount: 1 },
      { timestamp: '2024-12-06T07:00:00.000Z', status: 'up' as const, responseTime: 90, errorCount: 0 },
      { timestamp: '2024-12-06T06:00:00.000Z', status: 'up' as const, responseTime: 82, errorCount: 0 },
      { timestamp: '2024-12-06T05:00:00.000Z', status: 'up' as const, responseTime: 88, errorCount: 1 }
    ]
  },
  'file-system': {
    trend: 'stable',
    historyCount: 24,
    recentHistory: [
      { timestamp: '2024-12-06T09:00:00.000Z', status: 'up' as const, responseTime: 5, errorCount: 0 },
      { timestamp: '2024-12-06T08:00:00.000Z', status: 'up' as const, responseTime: 4, errorCount: 0 },
      { timestamp: '2024-12-06T07:00:00.000Z', status: 'up' as const, responseTime: 6, errorCount: 0 },
      { timestamp: '2024-12-06T06:00:00.000Z', status: 'up' as const, responseTime: 5, errorCount: 0 },
      { timestamp: '2024-12-06T05:00:00.000Z', status: 'up' as const, responseTime: 3, errorCount: 0 }
    ]
  }
};

interface RouteParams {
  params: Promise<{
    serviceName: string;
  }>
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { serviceName } = await context.params;
    
    // Validate service name
    if (!serviceName) {
      return NextResponse.json(
        {
          error: 'Service name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Get service history data
    const serviceData = serviceHistoryData[serviceName as keyof typeof serviceHistoryData];
    
    if (!serviceData) {
      return NextResponse.json(
        {
          error: `Service '${serviceName}' not found`,
          availableServices: Object.keys(serviceHistoryData),
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    const healthTrend = {
      serviceName,
      trend: serviceData.trend,
      historyCount: serviceData.historyCount,
      recentHistory: serviceData.recentHistory,
      summary: {
        uptime: Math.round(
          (serviceData.recentHistory.filter(h => h.status === 'up').length / 
           serviceData.recentHistory.length) * 100 * 100
        ) / 100,
        avgResponseTime: Math.round(
          serviceData.recentHistory.reduce((sum, h) => sum + h.responseTime, 0) / 
          serviceData.recentHistory.length
        ),
        totalErrors: serviceData.recentHistory.reduce((sum, h) => sum + h.errorCount, 0),
        errorRate: Math.round(
          (serviceData.recentHistory.reduce((sum, h) => sum + h.errorCount, 0) / 
           serviceData.recentHistory.length) * 100
        ) / 100
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(healthTrend);
  } catch (error) {
    console.error('Service health trend retrieval failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get service health trend',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
