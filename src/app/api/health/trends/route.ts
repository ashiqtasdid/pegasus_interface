import { NextResponse } from 'next/server';

// Mock historical data for health trends
const mockHealthTrends = {
  database: {
    uptime: 99.8,
    avgResponseTime: 12,
    errorRate: 0.2,
    lastStatus: 'up' as const
  },
  'external-api': {
    uptime: 97.5,
    avgResponseTime: 45,
    errorRate: 2.5,
    lastStatus: 'up' as const
  },
  'auth-service': {
    uptime: 99.9,
    avgResponseTime: 8,
    errorRate: 0.1,
    lastStatus: 'up' as const
  },
  'gemini-ai': {
    uptime: 96.2,
    avgResponseTime: 120,
    errorRate: 3.8,
    lastStatus: 'up' as const
  },
  'compiler-service': {
    uptime: 98.1,
    avgResponseTime: 85,
    errorRate: 1.9,
    lastStatus: 'up' as const
  },
  'file-system': {
    uptime: 99.5,
    avgResponseTime: 5,
    errorRate: 0.5,
    lastStatus: 'up' as const
  }
};

export async function GET() {
  try {
    const healthTrends = {
      timestamp: new Date().toISOString(),
      trends: mockHealthTrends,
      summary: {
        totalServices: Object.keys(mockHealthTrends).length,
        healthyServices: Object.values(mockHealthTrends).filter(trend => trend.lastStatus === 'up').length,
        averageUptime: Math.round(
          Object.values(mockHealthTrends).reduce((sum, trend) => sum + trend.uptime, 0) / 
          Object.keys(mockHealthTrends).length * 100
        ) / 100,
        averageResponseTime: Math.round(
          Object.values(mockHealthTrends).reduce((sum, trend) => sum + trend.avgResponseTime, 0) / 
          Object.keys(mockHealthTrends).length
        ),
        totalErrorRate: Math.round(
          Object.values(mockHealthTrends).reduce((sum, trend) => sum + trend.errorRate, 0) / 
          Object.keys(mockHealthTrends).length * 100
        ) / 100
      }
    };

    return NextResponse.json(healthTrends);
  } catch (error) {
    console.error('Health trends retrieval failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get health trends',
        timestamp: new Date().toISOString(),
        trends: {},
        summary: {
          totalServices: 0,
          healthyServices: 0,
          averageUptime: 0,
          averageResponseTime: 0,
          totalErrorRate: 0
        }
      },
      { status: 500 }
    );
  }
}
