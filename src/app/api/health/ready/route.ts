import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check critical services for readiness
    const checks = {
      database: true, // Mock: database connection is ready
      externalApi: true, // Mock: external API is ready
      configuration: true, // Mock: configuration is loaded
      dependencies: true // Mock: all dependencies are ready
    };

    const allReady = Object.values(checks).every(Boolean);
    const criticalBreakers = Object.entries(checks)
      .filter(([, ready]) => !ready)
      .map(([service]) => service);

    const response = {
      ready: allReady,
      message: allReady 
        ? 'Service is ready to accept traffic' 
        : 'Service is not ready - waiting for dependencies',
      checks,
      ...(criticalBreakers.length > 0 && { criticalBreakers }),
      timestamp: new Date().toISOString()
    };

    const status = allReady ? 200 : 503;
    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Readiness check failed:', error);
    return NextResponse.json(
      {
        ready: false,
        message: 'Readiness check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
