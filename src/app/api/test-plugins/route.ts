import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://37.114.41.124:3000';
    console.log('Testing API connection to:', `${apiUrl}/create/plugins`);
    
    const response = await fetch(`${apiUrl}/create/plugins`);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    return NextResponse.json({
      success: true,
      data,
      apiUrl,
      status: response.status
    });
  } catch (error) {
    console.error('API Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL
    }, { status: 500 });
  }
}
