import { NextResponse } from 'next/server';
import * as os from 'os';

export async function GET() {
  try {
    // System information
    const system = {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: Math.floor(os.uptime()),
    };

    // Process information
    const processInfo = {
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
    };

    // Mock services status (replace with actual service health checks)
    const servicesStatus = [
      {
        name: 'database',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 12
      },
      {
        name: 'external-api',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 45
      },
      {
        name: 'auth-service',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 8
      },
      {
        name: 'gemini-ai',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime: 120
      }
    ];

    // System metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Load average
    const loadAvg = os.loadavg();
    
    const metrics = {
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: memoryUsagePercent
      },
      cpu: {
        loadAverage: loadAvg,
        cores: os.cpus().length
      },
      system: system,
      process: processInfo
    };

    // Generate recommendations based on system state
    const recommendations = [];
    if (memoryUsagePercent > 80) {
      recommendations.push('High memory usage detected - consider scaling or optimization');
    }
    if (loadAvg[0] > os.cpus().length) {
      recommendations.push('High CPU load detected - monitor system performance');
    }

    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      servicesStatus,
      metrics,
      recommendations
    };

    return NextResponse.json(systemHealth);
  } catch (error) {
    console.error('System health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Failed to get system health',
        timestamp: new Date().toISOString(),
        servicesStatus: [],
        metrics: {},
        recommendations: ['System health check failed - investigate server issues']
      },
      { status: 500 }
    );
  }
}
