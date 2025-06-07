import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService, generateConversationTitle } from '@/lib/database';

/**
 * Enhanced Chat API Route
 * Provides comprehensive chat functionality with conversation management
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    const conversationId = searchParams.get('conversationId');
    const pluginId = searchParams.get('pluginId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await DatabaseService.getChatMessages(userId, conversationId, {
        limit,
        offset
      });

      return NextResponse.json({
        success: true,
        messages,
        conversationId,
        count: messages.length
      });
    } else {
      // Get conversations list
      const conversations = await DatabaseService.getConversations(userId, {
        pluginId: pluginId || undefined,
        limit,
        status: 'active'
      });

      return NextResponse.json({
        success: true,
        conversations,
        count: conversations.length
      });
    }

  } catch (error) {
    console.error('Failed to fetch chat data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      message,
      conversationId,
      pluginId,
      pluginName,
      type = 'general-help',
      aiModel = 'gpt-4',
      temperature = 0.7
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let finalConversationId = conversationId;

    // Create new conversation if not provided
    if (!finalConversationId) {
      const title = generateConversationTitle(message);
      finalConversationId = await DatabaseService.createConversation(userId, title, {
        pluginId,
        pluginName,
        type,
        description: `Conversation about ${pluginName || 'general help'}`
      });
    }

    // TODO: Process message with AI (integrate with your AI service)
    const startTime = Date.now();
    
    // Simulate AI response for now
    const aiResponse = `I understand you want help with: "${message}". This is a simulated response that would come from your AI service.`;
    
    const responseTime = Date.now() - startTime;
    const tokensUsed = {
      input: Math.ceil(message.length / 4), // Rough token estimation
      output: Math.ceil(aiResponse.length / 4),
      total: Math.ceil((message.length + aiResponse.length) / 4)
    };

    // Save the message to database
    const messageData = {
      conversationId: finalConversationId,
      userId,
      message,
      response: aiResponse,
      role: 'user' as const,
      messageType: 'question' as const,
      intent: 'create' as const,
      operations: [],
      codeBlocks: [],
      aiModel,
      tokensUsed,
      responseTime,
      temperature,
      status: 'completed' as const,
      isEdited: false
    };

    const messageId = await DatabaseService.saveChatMessage(messageData);

    // Log activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'chat_message',
      action: 'send_message',
      description: `Sent message in conversation`,
      conversationId: finalConversationId,
      messageId,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined,
        duration: responseTime
      }
    });

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: finalConversationId,
      messageId,
      tokensUsed,
      responseTime
    });

  } catch (error) {
    console.error('Failed to process chat message:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // const userId = session.user.id; // Note: userId is available if needed later
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const updates = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    await DatabaseService.updateConversation(conversationId, updates);

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully',
      conversationId
    });

  } catch (error) {
    console.error('Failed to update conversation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    await DatabaseService.deleteConversation(userId, conversationId);

    // Log activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'chat_message',
      action: 'delete_conversation',
      description: `Deleted conversation`,
      conversationId,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
