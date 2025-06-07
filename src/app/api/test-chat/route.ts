import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

// Test chat functionality without authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const chatRequest = {
      message: body.message || "What does this plugin do?",
      name: body.name || "GreetPlugin"
    };
    
    console.log('Testing chat with:', chatRequest);
    
    // Use a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/create/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          error: `External API responded with status: ${response.status}`,
          endpoint: '/create/chat',
          request: chatRequest
        },
        { status: response.status }
      );
    }
    
    const data = await response.text();
    return NextResponse.json({
      success: true,
      message: 'Chat test successful',
      response: data,
      request: chatRequest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Chat request timed out after 10 seconds',
          endpoint: '/create/chat'
        },
        { status: 408 }
      );
    }
    
    console.error('Chat test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/create/chat'
      },
      { status: 500 }
    );
  }
}
