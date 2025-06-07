import { NextResponse } from 'next/server';
import * as os from 'os';

export async function GET() {
  try {
    // CPU metrics
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    // Process memory metrics
    const processMemory = process.memoryUsage();

    // Mock disk metrics (in a real implementation, you'd use fs.statSync)
    const diskUsed = 50 * 1024 * 1024 * 1024; // Mock: 50GB used
    const diskTotal = 100 * 1024 * 1024 * 1024; // Mock: 100GB total
    const diskFree = diskTotal - diskUsed;
    const diskUsagePercent = Math.round((diskUsed / diskTotal) * 100);

    const metrics = {
      metrics: {
        cpu: {
          usage: cpuUsage,
          loadAverage: loadAvg,
          cores: cpus.length
        },
        memory: {
          system: {
            used: usedMemory,
            total: totalMemory,
            free: freeMemory,
            percentage: memoryUsagePercent
          },
          process: {
            heapUsed: processMemory.heapUsed,
            heapTotal: processMemory.heapTotal,
            external: processMemory.external,
            rss: processMemory.rss
          }
        },
        disk: {
          used: diskUsed,
          total: diskTotal,
          free: diskFree,
          percentage: diskUsagePercent
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: os.uptime()
        }
      },
      health: {
        status: 'ok',
        checks: {
          memory: memoryUsagePercent < 90 ? 'healthy' : 'warning',
          cpu: cpuUsage < 80 ? 'healthy' : 'warning',
          disk: diskUsagePercent < 90 ? 'healthy' : 'warning'
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('System metrics failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get system metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
