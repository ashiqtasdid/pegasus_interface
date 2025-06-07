import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function POST(request: NextRequest) {
  try {
    // Get user session for user-specific plugin generation
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Add userId to the request body for user-specific plugin creation
    const requestBody = {
      ...body,
      userId: session.user.id,
    };
    
    const response = await fetch(`${API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.text();
    return NextResponse.json({ message: data });
  } catch (error) {
    console.error('Failed to generate plugin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
