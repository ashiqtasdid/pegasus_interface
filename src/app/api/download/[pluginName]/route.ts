import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCorsErrorResponse, handleOptions, corsHeaders } from '../../../../utils/cors';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pluginName: string }> }
) {
  try {
    // Get user session for user-specific plugin download
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    const { pluginName } = await params;
    const userId = session.user.id;
    
    const response = await fetch(`${API_BASE_URL}/create/download/${pluginName}?userId=${encodeURIComponent(userId)}`);
    
    if (!response.ok) {
      return createCorsErrorResponse(`Download failed: ${response.status}`, response.status);
    }
    
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/java-archive',
        'Content-Disposition': `attachment; filename="${pluginName}.jar"`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Download failed:', error);
    return createCorsErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function OPTIONS() {
  return handleOptions();
}
