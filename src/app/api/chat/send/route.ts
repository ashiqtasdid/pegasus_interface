import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';
import { createCorsResponse, createCorsErrorResponse, handleOptions } from '../../../../utils/cors';

const API_BASE_URL = process.env.API_BASE_URL || 'http://37.114.41.124:3000';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return createCorsErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    console.log('Received chat request:', JSON.stringify(body, null, 2));
    
    const { message, pluginName, conversationId } = body;

    if (!message || !pluginName) {
      console.log('Missing required fields:', { message: !!message, pluginName: !!pluginName });
      return createCorsErrorResponse('Message and plugin name are required', 400);
    }

    // Create new conversation if not provided
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      console.log(`Creating new conversation for user ${session.user.id} and plugin ${pluginName}`);
      try {
        currentConversationId = await DatabaseService.createConversation(
          session.user.id,
          pluginName,
          message
        );
        console.log(`Created new conversation with ID: ${currentConversationId}`);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        // Continue without conversation ID if creation fails
      }
    }

    // Send message to external API using the documented format with userId
    console.log(`Sending request to external API: ${API_BASE_URL}/create/chat`);
    const response = await fetch(`${API_BASE_URL}/create/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: session.user.id, // Include userId for user-specific plugin access
        pluginName,
        message,
        previousContext: body.previousContext
      }),
    });

    if (!response.ok) {
      console.error(`External API error: Status ${response.status}`);
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`Error details: ${errorText}`);
      return createCorsErrorResponse(`External API responded with status: ${response.status}`, response.status);
    }

    const apiData = await response.json();

    // Determine message type (info or modification) based on response
    const messageType = apiData.operations && apiData.operations.length > 0 ? 'modification' : 'info';

    // Save chat message to database
    const messageId = await DatabaseService.saveChatMessage({
      userId: session.user.id,
      conversationId: currentConversationId,
      message,
      response: apiData.response,
      role: 'assistant',
      messageType,
      intent: apiData.operations && apiData.operations.length > 0 ? 'modify' : 'explain',
      operations: apiData.operations,
      compilationResult: apiData.compilationResult,
      aiModel: 'gpt-4',
      tokensUsed: {
        input: 0, // TODO: Calculate actual token usage
        output: 0,
        total: 0
      },
      responseTime: 0, // TODO: Calculate actual response time
      temperature: 0.7,
      status: 'completed',
      isEdited: false,
    });

    // Update plugin status if compilation occurred
    if (apiData.compilationResult) {
      const status = apiData.compilationResult.success ? 'success' : 'failed';
      await DatabaseService.updatePluginStatus(session.user.id, pluginName, status);
    }

    return createCorsResponse({
      ...apiData,
      messageId,
      conversationId: currentConversationId,
      success: true
    });

  } catch (error) {
    console.error('Failed to chat with plugin:', error);
    return createCorsErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function OPTIONS() {
  return handleOptions();
}
