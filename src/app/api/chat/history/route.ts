import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pluginName = searchParams.get('pluginName');
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await DatabaseService.getChatMessages(session.user.id, conversationId);
      return NextResponse.json({ success: true, messages });
    } else {
      // Get all conversations for user (optionally filtered by plugin)
      const conversations = await DatabaseService.getConversations(session.user.id, { 
        pluginId: pluginName || undefined 
      });
      return NextResponse.json({ success: true, conversations });
    }

  } catch (error) {
    console.error('Failed to get chat history:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Conversation ID is required' 
      }, { status: 400 });
    }

    await DatabaseService.deleteConversation(session.user.id, conversationId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
