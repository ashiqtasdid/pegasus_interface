import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await request.json();
    
    // Validate the activity data
    if (!activity.action || !activity.resourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resourceType' },
        { status: 400 }
      );
    }

    // Ensure the user ID matches the session
    if (activity.userId !== session.user.id) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    // TODO: Store activity in database
    // For now, just log it
    console.log('User Activity:', {
      ...activity,
      sessionId: session.session.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity logging error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
