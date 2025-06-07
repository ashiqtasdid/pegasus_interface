import { NextResponse } from 'next/server';

// Standard CORS headers for all API routes
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Helper function to create CORS-enabled responses
export function createCorsResponse(data: any, options: { status?: number; headers?: Record<string, string> } = {}) {
  return NextResponse.json(data, {
    status: options.status || 200,
    headers: {
      ...corsHeaders,
      ...options.headers,
    },
  });
}

// Helper function for CORS-enabled error responses
export function createCorsErrorResponse(error: string, status = 500) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: corsHeaders,
    }
  );
}

// Standard OPTIONS handler for all routes
export function handleOptions() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Helper to add CORS headers to any Response
export function addCorsHeaders(response: Response): Response {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
