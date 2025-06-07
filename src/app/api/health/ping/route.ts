import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = {
      status: 'pong',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() // Will be updated by middleware if available
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Ping failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Ping failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
