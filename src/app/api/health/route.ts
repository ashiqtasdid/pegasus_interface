import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';
const startTime = Date.now();

export async function GET() {
  try {
    // Check external API health
    let externalApiStatus = 'unknown';
    let externalApiMessage = 'Not checked';
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        externalApiStatus = 'healthy';
        externalApiMessage = data.message || 'OK';
      } else {
        externalApiStatus = 'unhealthy';
        externalApiMessage = `API responded with status: ${response.status}`;
      }
    } catch (error) {
      externalApiStatus = 'unhealthy';
      externalApiMessage = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Check database connection
    let dbStatus = 'unknown';
    let dbMessage = 'Not checked';
    
    try {
      const { db } = await connectToDatabase();
      // Ping the database
      await db.command({ ping: 1 });
      dbStatus = 'healthy';
      dbMessage = 'Connected';
    } catch (error) {
      dbStatus = 'unhealthy';
      dbMessage = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Overall status is healthy only if both API and DB are healthy
    const overallStatus = (externalApiStatus === 'healthy' && dbStatus === 'healthy') 
      ? 'healthy' 
      : 'degraded';
    
    return NextResponse.json({
      status: overallStatus,
      message: overallStatus === 'healthy' ? 'All systems operational' : 'Some services are degraded',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - startTime) / 1000,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      services: {
        api: {
          status: externalApiStatus,
          message: externalApiMessage
        },
        database: {
          status: dbStatus,
          message: dbMessage
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
