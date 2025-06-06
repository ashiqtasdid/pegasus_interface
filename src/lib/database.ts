import { MongoClient, Db, Collection } from 'mongodb';

// Database connection
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we already have a connection, return it
  if (client && db) {
    return { client, db };
  }

  try {
    // Use the same MongoDB URI that Better Auth is using
    const mongodbUri = process.env.MONGODB_URI;
    
    if (!mongodbUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    client = new MongoClient(mongodbUri);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    // Use the same database as Better Auth
    db = client.db('better-auth');
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Reset connection state on error
    client = null;
    db = null;
    throw error;
  }
}

// Ensure database is connected before getting collections
async function ensureConnection(): Promise<Db> {
  try {
    if (!db) {
      const { db: database } = await connectToDatabase();
      return database;
    }
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Database Models
export interface UserPlugin {
  _id?: string;
  userId: string;
  pluginName: string;
  pluginData?: string; // JSON string of plugin metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'compiling' | 'success' | 'failed';
  downloadCount: number;
}

export interface ChatMessage {
  _id?: string;
  userId: string;
  pluginName: string;
  message: string;
  response: string;
  messageType: 'info' | 'modification';
  operations?: FileOperation[];
  compilationResult?: CompilationResult;
  timestamp: Date;
  conversationId: string; // Group related messages
}

export interface FileOperation {
  type: 'create' | 'modify' | 'delete';
  file: string;
  content: string;
}

export interface CompilationResult {
  success: boolean;
  output: string;
  errors: string[];
}

export interface ChatConversation {
  _id?: string;
  userId: string;
  pluginName: string;
  title: string; // Auto-generated from first message
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

// Database collections
export const getUserPluginsCollection = async (): Promise<Collection<UserPlugin>> => {
  const db = await ensureConnection();
  return db.collection<UserPlugin>('pegasus_user_plugins');
};

export const getChatMessagesCollection = async (): Promise<Collection<ChatMessage>> => {
  const db = await ensureConnection();
  return db.collection<ChatMessage>('pegasus_chat_messages');
};

export const getChatConversationsCollection = async (): Promise<Collection<ChatConversation>> => {
  const db = await ensureConnection();
  return db.collection<ChatConversation>('pegasus_chat_conversations');
};

// Helper functions
export const generateConversationTitle = (message: string): string => {
  // Generate a title from the first message (first 50 chars)
  const cleaned = message.replace(/\n/g, ' ').trim();
  return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
};

// Database operations
export class DatabaseService {
  // User Plugins
  static async saveUserPlugin(plugin: Omit<UserPlugin, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collection = await getUserPluginsCollection();
    const result = await collection.insertOne({
      ...plugin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId.toString();
  }

  static async getUserPlugins(userId: string): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    return await collection.find({ userId }).sort({ updatedAt: -1 }).toArray();
  }

  static async updatePluginStatus(userId: string, pluginName: string, status: UserPlugin['status']): Promise<void> {
    const collection = await getUserPluginsCollection();
    await collection.updateOne(
      { userId, pluginName },
      { $set: { status, updatedAt: new Date() } }
    );
  }

  static async incrementDownloadCount(userId: string, pluginName: string): Promise<void> {
    const collection = await getUserPluginsCollection();
    await collection.updateOne(
      { userId, pluginName },
      { $inc: { downloadCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  // Chat Conversations
  static async createConversation(userId: string, pluginName: string, firstMessage: string): Promise<string> {
    const collection = await getChatConversationsCollection();
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await collection.insertOne({
      _id: conversationId,
      userId,
      pluginName,
      title: generateConversationTitle(firstMessage),
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    });

    return conversationId;
  }

  static async getConversations(userId: string, pluginName?: string): Promise<ChatConversation[]> {
    const collection = await getChatConversationsCollection();
    const filter: any = { userId };
    if (pluginName) {
      filter.pluginName = pluginName;
    }
    return await collection.find(filter).sort({ updatedAt: -1 }).toArray();
  }

  static async updateConversation(conversationId: string): Promise<void> {
    const collection = await getChatConversationsCollection();
    await collection.updateOne(
      { _id: conversationId },
      { 
        $set: { updatedAt: new Date() },
        $inc: { messageCount: 1 }
      }
    );
  }

  // Chat Messages
  static async saveChatMessage(message: Omit<ChatMessage, '_id' | 'timestamp'>): Promise<string> {
    const collection = await getChatMessagesCollection();
    const result = await collection.insertOne({
      ...message,
      timestamp: new Date(),
    });

    // Update conversation
    await this.updateConversation(message.conversationId);

    return result.insertedId.toString();
  }

  static async getChatMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
    const collection = await getChatMessagesCollection();
    return await collection.find({ userId, conversationId }).sort({ timestamp: 1 }).toArray();
  }

  static async getConversationMessages(userId: string, pluginName: string): Promise<ChatMessage[]> {
    const collection = await getChatMessagesCollection();
    return await collection.find({ userId, pluginName }).sort({ timestamp: 1 }).toArray();
  }

  static async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversationsCollection = await getChatConversationsCollection();
    const messagesCollection = await getChatMessagesCollection();
    
    // Delete conversation and all its messages
    await Promise.all([
      conversationsCollection.deleteOne({ _id: conversationId, userId }),
      messagesCollection.deleteMany({ conversationId, userId })
    ]);
  }
}
