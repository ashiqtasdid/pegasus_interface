import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Server-side: Testing plugins endpoint');
    
    const response = await fetch('http://37.114.41.124:3000/create/plugins', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Server-side response status:', response.status);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Server responded with status: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Server-side response data:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'server-side'
    });
  } catch (error) {
    console.error('Server-side error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'server-side'
      },
      { status: 500 }
    );
  }
}
