import { NextResponse } from 'next/server';

// Mock circuit breaker data (in a real implementation, this would come from your circuit breaker library)
const circuitBreakers = [
  {
    name: 'external-api',
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: null,
    threshold: 5,
    timeout: 60000
  },
  {
    name: 'database',
    state: 'CLOSED', 
    failureCount: 0,
    lastFailureTime: null,
    threshold: 3,
    timeout: 30000
  },
  {
    name: 'auth-service',
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: null,
    threshold: 5,
    timeout: 60000
  }
];

export async function GET() {
  try {
    const openBreakers = circuitBreakers.filter(cb => cb.state === 'OPEN').length;
    const halfOpenBreakers = circuitBreakers.filter(cb => cb.state === 'HALF_OPEN').length;
    const closedBreakers = circuitBreakers.filter(cb => cb.state === 'CLOSED').length;

    const response = {
      total: circuitBreakers.length,
      open: openBreakers,
      halfOpen: halfOpenBreakers,
      closed: closedBreakers,
      details: circuitBreakers.map(cb => ({
        name: cb.name,
        state: cb.state,
        failureCount: cb.failureCount,
        lastFailureTime: cb.lastFailureTime,
        threshold: cb.threshold,
        timeout: cb.timeout
      })),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Circuit breaker status failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get circuit breaker status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
