import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';

// This route initializes the database connection and ensures collections exist
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { db } = await connectToDatabase();
    
    // Ensure collections exist (MongoDB creates them automatically when first document is inserted)
    // But we can create indexes for better performance
    
    // Create indexes for user plugins collection
    const userPluginsCollection = db.collection('pegasus_user_plugins');
    await userPluginsCollection.createIndex({ userId: 1 });
    await userPluginsCollection.createIndex({ pluginName: 1 });
    await userPluginsCollection.createIndex({ createdAt: -1 });
    
    // Create indexes for chat messages collection
    const chatMessagesCollection = db.collection('pegasus_chat_messages');
    await chatMessagesCollection.createIndex({ userId: 1 });
    await chatMessagesCollection.createIndex({ conversationId: 1 });
    await chatMessagesCollection.createIndex({ timestamp: -1 });
    
    // Create indexes for chat conversations collection
    const chatConversationsCollection = db.collection('pegasus_chat_conversations');
    await chatConversationsCollection.createIndex({ userId: 1 });
    await chatConversationsCollection.createIndex({ pluginName: 1 });
    await chatConversationsCollection.createIndex({ createdAt: -1 });
    
    console.log('Database initialization completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      collections: [
        'pegasus_user_plugins',
        'pegasus_chat_messages', 
        'pegasus_chat_conversations'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same as GET - allows both methods for flexibility
  return GET(request);
}