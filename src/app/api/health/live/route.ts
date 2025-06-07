import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple liveness check - if we can respond, we're alive
    const uptime = process.uptime();
    
    const response = {
      alive: true,
      message: 'Service is alive and responding',
      uptime: Math.floor(uptime),
      pid: process.pid,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    // If we can respond with an error, we're still technically alive
    console.error('Liveness check error:', error);
    return NextResponse.json(
      {
        alive: true, // Still alive if we can respond
        message: 'Service is alive but encountered an error',
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: Math.floor(process.uptime()),
        pid: process.pid,
        timestamp: new Date().toISOString()
      },
      { status: 200 } // 200 because service is still alive
    );
  }
}
