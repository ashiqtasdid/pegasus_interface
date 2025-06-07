import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../utils/cors';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return createCorsErrorResponse(`API responded with status: ${response.status}`, response.status);
    }
    
    const data = await response.json();
    return createCorsResponse(data);
  } catch (error) {
    console.error('Health check failed:', error);
    return createCorsErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function OPTIONS() {
  return handleOptions();
}
