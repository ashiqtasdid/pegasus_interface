import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function GET() {
  try {
    // Get basic health from external API
    const externalHealthResponse = await fetch(`${API_BASE_URL}/health`, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    let externalHealth = { status: 'down', error: 'External API unavailable' };
    if (externalHealthResponse.ok) {
      externalHealth = await externalHealthResponse.json();
    }

    // System metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Mock service checks (replace with actual service health checks)
    const services = [
      {
        name: 'database',
        status: 'up',
        responseTime: 12,
        errors: []
      },
      {
        name: 'external-api',
        status: externalHealth.status === 'ok' ? 'up' : 'down',
        responseTime: externalHealthResponse.ok ? 45 : 0,
        errors: externalHealth.status !== 'ok' ? [externalHealth.error || 'API unreachable'] : []
      },
      {
        name: 'auth-service',
        status: 'up',
        responseTime: 8,
        errors: []
      }
    ];

    // Determine overall status
    const hasDownServices = services.some(service => service.status === 'down');
    const overallStatus = hasDownServices ? 'degraded' : 'ok';

    const detailedHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: Math.floor(uptime),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(detailedHealth);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: [],
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 500 }
    );
  }
}
