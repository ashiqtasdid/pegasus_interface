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

// Enhanced Database Models with hierarchical structure

// User Profile Extensions
export interface UserProfile {
  _id?: string;
  userId: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultPluginType: string;
    codeStyle: 'compact' | 'verbose';
    autoSave: boolean;
    notifications: {
      email: boolean;
      inApp: boolean;
      pluginUpdates: boolean;
    };
  };
  subscription: {
    tier: 'free' | 'pro' | 'enterprise';
    validUntil?: Date;
    features: string[];
  };
  statistics: {
    totalPlugins: number;
    totalDownloads: number;
    totalChatMessages: number;
    accountAge: number; // days
    lastActive: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Plugin Management
export interface UserPlugin {
  _id?: string;
  userId: string;
  pluginId: string; // Unique plugin identifier
  pluginName: string;
  displayName: string;
  description?: string;
  category: 'utility' | 'automation' | 'development' | 'ui' | 'data' | 'other';
  tags: string[];
  
  // Plugin metadata
  metadata: {
    version: string;
    author: string;
    license: string;
    dependencies: string[];
    permissions: string[];
    compatibility: string[];
    fileSize: number; // bytes
    entryPoint: string;
  };
  
  // Plugin content and files
  files: PluginFile[];
  mainFile: string; // Path to main plugin file
  
  // Status and compilation
  status: 'pending' | 'compiling' | 'success' | 'failed' | 'deprecated';
  compilationResult?: CompilationResult;
  
  // Analytics
  analytics: {
    downloadCount: number;
    uniqueDownloads: number;
    viewCount: number;
    installCount: number;
    lastDownload?: Date;
    averageRating?: number;
    reviewCount: number;
  };
  
  // Versioning
  versions: PluginVersion[];
  currentVersion: string;
  
  // Sharing and visibility
  visibility: 'private' | 'public' | 'unlisted';
  isTemplate: boolean;
  isFeatured: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  publishedAt?: Date;
}

export interface PluginFile {
  id: string;
  path: string;
  name: string;
  content: string;
  type: 'js' | 'ts' | 'json' | 'css' | 'html' | 'md' | 'other';
  size: number;
  encoding: 'utf8' | 'base64';
  checksum: string;
  lastModified: Date;
}

export interface PluginVersion {
  version: string;
  changes: string[];
  changelog: string;
  createdAt: Date;
  downloadCount: number;
  isStable: boolean;
  isDeprecated: boolean;
  files: PluginFile[];
  compilationResult?: CompilationResult;
}

export interface CompilationResult {
  success: boolean;
  output: string;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  buildTime: number; // milliseconds
  outputSize: number; // bytes
  sourceMap?: string;
  dependencies: string[];
}

export interface CompilationError {
  type: 'syntax' | 'type' | 'runtime' | 'dependency';
  message: string;
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface CompilationWarning {
  type: 'performance' | 'compatibility' | 'security' | 'style';
  message: string;
  file: string;
  line: number;
  column: number;
  suggestion?: string;
}

// Chat System with Enhanced Structure
export interface ChatConversation {
  _id?: string;
  userId: string;
  pluginId?: string; // Optional - can be general conversation
  pluginName?: string;
  
  // Conversation metadata
  title: string;
  description?: string;
  type: 'plugin-development' | 'general-help' | 'debugging' | 'feature-request';
  
  // Conversation state
  status: 'active' | 'archived' | 'deleted';
  isStarred: boolean;
  tags: string[];
  
  // Analytics
  messageCount: number;
  lastMessageAt: Date;
  totalTokensUsed: number;
  averageResponseTime: number; // milliseconds
  
  // AI Context
  aiModel: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface ChatMessage {
  _id?: string;
  conversationId: string;
  userId: string;
  
  // Message content
  message: string;
  response: string;
  role: 'user' | 'assistant' | 'system';
  
  // Message metadata
  messageType: 'info' | 'modification' | 'question' | 'command' | 'error';
  intent?: 'create' | 'modify' | 'debug' | 'explain' | 'delete';
  
  // Technical details
  operations?: FileOperation[];
  compilationResult?: CompilationResult;
  codeBlocks?: CodeBlock[];
  
  // AI metadata
  aiModel: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  responseTime: number; // milliseconds
  temperature: number;
  
  // Message status
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  isEdited: boolean;
  editHistory?: MessageEdit[];
  
  // User interaction
  feedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    helpful: boolean;
    comment?: string;
  };
  
  // Timestamps
  timestamp: Date;
  editedAt?: Date;
}

export interface MessageEdit {
  originalMessage: string;
  editedMessage: string;
  editedAt: Date;
  reason?: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filename?: string;
  startLine?: number;
  endLine?: number;
  isExecutable: boolean;
  executionResult?: {
    success: boolean;
    output: string;
    error?: string;
  };
}

export interface FileOperation {
  id: string;
  type: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  file: string;
  newFile?: string; // For rename/move operations
  content?: string;
  oldContent?: string; // For modify operations
  size: number;
  encoding: 'utf8' | 'base64';
  checksum: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

// User Analytics and Activity
export interface UserActivity {
  _id?: string;
  userId: string;
  
  // Activity details
  type: 'plugin_created' | 'plugin_downloaded' | 'chat_message' | 'login' | 'logout' | 'file_operation';
  action: string;
  description: string;
  
  // Context
  pluginId?: string;
  conversationId?: string;
  messageId?: string;
  
  // Metadata
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    duration?: number; // milliseconds
    success: boolean;
    error?: string;
  };
  
  // Timestamps
  timestamp: Date;
  date: string; // YYYY-MM-DD for easy querying
}

// Plugin Analytics
export interface PluginAnalytics {
  _id?: string;
  pluginId: string;
  userId: string;
  
  // Time-based metrics
  date: string; // YYYY-MM-DD
  
  // Usage metrics
  views: number;
  downloads: number;
  installs: number;
  uninstalls: number;
  
  // User interaction
  uniqueUsers: string[]; // Array of user IDs
  averageSessionDuration: number;
  
  // Geographic data
  countries: { [country: string]: number };
  
  // Technical metrics
  errorRate: number;
  successfulCompilations: number;
  failedCompilations: number;
  
  // Performance
  averageLoadTime: number;
  averageExecutionTime: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Plugin Reviews and Ratings
export interface PluginReview {
  _id?: string;
  pluginId: string;
  userId: string;
  authorId: string; // Plugin author
  
  // Review content
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  
  // Review metadata
  isVerified: boolean;
  isEdited: boolean;
  helpfulCount: number;
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
}

// Plugin Collections (User-created plugin lists)
export interface PluginCollection {
  _id?: string;
  userId: string;
  
  // Collection details
  name: string;
  description: string;
  tags: string[];
  
  // Collection content
  pluginIds: string[];
  isPublic: boolean;
  
  // Analytics
  viewCount: number;
  followerCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Minecraft Server Management Interfaces
export interface MinecraftServerConfig {
  userId: string; // User identifier
  serverName: string; // Server display name
  port: number; // Server port (25565+)
  maxPlayers?: number; // Maximum players (default: 20)
  gameMode?: 'survival' | 'creative' | 'adventure' | 'spectator';
  difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';
  enableWhitelist?: boolean; // Whitelist mode
  memoryLimit?: string; // JVM memory limit (e.g., "2G")
  javaArgs?: string[]; // Additional JVM arguments
  plugins?: string[]; // Plugin list
}

export interface ServerStatus {
  _id?: string;
  id: string; // Unique server ID (userId_serverName)
  userId: string; // Owner user ID
  status:
    | 'creating'
    | 'starting'
    | 'running'
    | 'stopping'
    | 'stopped'
    | 'error';
  port: number; // Server port
  playerCount: number; // Current player count
  maxPlayers: number; // Maximum players
  uptime: number; // Server uptime in seconds
  lastSeen: Date; // Last status update
  lastPlayerActivity: Date; // Last player activity timestamp
  autoShutdown: boolean; // Auto-shutdown enabled
  inactiveShutdownMinutes: number; // Inactivity timeout
  containerId?: string; // Docker container ID
  error?: string; // Error message if any
  serverName?: string; // Display name
  gameMode?: string; // Current game mode
  difficulty?: string; // Current difficulty
  pvp?: boolean; // PvP enabled
  onlinePlayers?: string[]; // List of online players
  
  // Configuration
  config: MinecraftServerConfig;
  
  // Analytics
  analytics: {
    totalPlayers: number;
    peakPlayerCount: number;
    totalUptime: number; // Total uptime in seconds
    restartCount: number;
    lastRestart: Date;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface MinecraftServerCommand {
  _id?: string;
  serverId: string;
  userId: string;
  command: string;
  response?: string;
  timestamp: Date;
  status: 'pending' | 'executed' | 'failed';
  executionTime?: number; // milliseconds
}

export interface MinecraftServerLog {
  _id?: string;
  serverId: string;
  userId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  source: 'server' | 'plugin' | 'system';
}

// Enhanced Database collections with comprehensive schema support
export const getUserProfilesCollection = async (): Promise<Collection<UserProfile>> => {
  const db = await ensureConnection();
  return db.collection<UserProfile>('pegasus_user_profiles');
};

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

export const getUserActivitiesCollection = async (): Promise<Collection<UserActivity>> => {
  const db = await ensureConnection();
  return db.collection<UserActivity>('pegasus_user_activities');
};

export const getPluginAnalyticsCollection = async (): Promise<Collection<PluginAnalytics>> => {
  const db = await ensureConnection();
  return db.collection<PluginAnalytics>('pegasus_plugin_analytics');
};

export const getPluginReviewsCollection = async (): Promise<Collection<PluginReview>> => {
  const db = await ensureConnection();
  return db.collection<PluginReview>('pegasus_plugin_reviews');
};

export const getPluginCollectionsCollection = async (): Promise<Collection<PluginCollection>> => {
  const db = await ensureConnection();
  return db.collection<PluginCollection>('pegasus_plugin_collections');
};

export const getServerStatusCollection = async (): Promise<Collection<ServerStatus>> => {
  const db = await ensureConnection();
  return db.collection<ServerStatus>('pegasus_server_status');
};

export const getMinecraftServersCollection = async (): Promise<Collection<ServerStatus>> => {
  const db = await ensureConnection();
  return db.collection<ServerStatus>('pegasus_minecraft_servers');
};

export const getMinecraftServerCommandsCollection = async (): Promise<Collection<MinecraftServerCommand>> => {
  const db = await ensureConnection();
  return db.collection<MinecraftServerCommand>('pegasus_minecraft_server_commands');
};

export const getMinecraftServerLogsCollection = async (): Promise<Collection<MinecraftServerLog>> => {
  const db = await ensureConnection();
  return db.collection<MinecraftServerLog>('pegasus_minecraft_server_logs');
};

// Helper functions
export const generateConversationTitle = (message: string): string => {
  // Generate a title from the first message (first 50 chars)
  const cleaned = message.replace(/\n/g, ' ').trim();
  return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
};

// Enhanced Database Service with comprehensive functionality
export class DatabaseService {
  // === USER PROFILE MANAGEMENT ===
  static async createUserProfile(userId: string): Promise<string> {
    const collection = await getUserProfilesCollection();
    
    const defaultProfile: Omit<UserProfile, '_id'> = {
      userId,
      preferences: {
        theme: 'system',
        defaultPluginType: 'utility',
        codeStyle: 'compact',
        autoSave: true,
        notifications: {
          email: true,
          inApp: true,
          pluginUpdates: true,
        },
      },
      subscription: {
        tier: 'free',
        features: ['basic-plugins', 'public-sharing'],
      },
      statistics: {
        totalPlugins: 0,
        totalDownloads: 0,
        totalChatMessages: 0,
        accountAge: 0,
        lastActive: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(defaultProfile);
    return result.insertedId.toString();
  }

  static async getUserByEmail(email: string): Promise<any> {
    // This would typically query your user authentication database
    // For now, we'll create a placeholder that works with better-auth structure
    // In a real implementation, this would integrate with your auth provider's user storage
    try {
      // Return a mock user structure that matches what better-auth provides
      // In production, this should query your actual user database
      return {
        _id: { toString: () => email.replace('@', '_').replace('.', '_') },
        email,
        name: email.split('@')[0],
        id: email.replace('@', '_').replace('.', '_')
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const collection = await getUserProfilesCollection();
    return await collection.findOne({ userId });
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const collection = await getUserProfilesCollection();
    await collection.updateOne(
      { userId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
  }

  // === PLUGIN MANAGEMENT ===
  static async saveUserPlugin(plugin: Omit<UserPlugin, '_id' | 'createdAt' | 'updatedAt' | 'lastModified'>): Promise<string> {
    const collection = await getUserPluginsCollection();
    
    const pluginData: Omit<UserPlugin, '_id'> = {
      ...plugin,
      pluginId: plugin.pluginId || `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      analytics: plugin.analytics || {
        downloadCount: 0,
        uniqueDownloads: 0,
        viewCount: 0,
        installCount: 0,
        reviewCount: 0,
      },
      versions: plugin.versions || [],
      currentVersion: plugin.currentVersion || '1.0.0',
      visibility: plugin.visibility || 'private',
      isTemplate: plugin.isTemplate || false,
      isFeatured: plugin.isFeatured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModified: new Date(),
    };

    const result = await collection.insertOne(pluginData);
    
    // Update user statistics
    await this.incrementUserStat(plugin.userId, 'totalPlugins', 1);
    
    return result.insertedId.toString();
  }

  static async getUserPlugins(userId: string, options?: {
    category?: string;
    status?: string;
    visibility?: string;
    limit?: number;
    sortBy?: string;
  }): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    
    const filter: any = { userId };
    if (options?.category) filter.category = options.category;
    if (options?.status) filter.status = options.status;
    if (options?.visibility) filter.visibility = options.visibility;
    
    let query = collection.find(filter);
    
    if (options?.sortBy) {
      const sortField = options.sortBy.startsWith('-') ? 
        options.sortBy.substring(1) : options.sortBy;
      const sortDirection = options.sortBy.startsWith('-') ? -1 : 1;
      query = query.sort({ [sortField]: sortDirection });
    } else {
      query = query.sort({ updatedAt: -1 });
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.toArray();
  }

  static async getPluginById(pluginId: string, userId?: string): Promise<UserPlugin | null> {
    const collection = await getUserPluginsCollection();
    const filter: any = { pluginId };
    if (userId) filter.userId = userId;
    
    return await collection.findOne(filter);
  }

  static async updatePlugin(pluginId: string, userId: string, updates: Partial<UserPlugin>): Promise<void> {
    const collection = await getUserPluginsCollection();
    await collection.updateOne(
      { pluginId, userId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date(),
          lastModified: new Date()
        } 
      }
    );
  }

  static async updatePluginStatus(userId: string, pluginId: string, status: UserPlugin['status'], compilationResult?: CompilationResult): Promise<void> {
    const collection = await getUserPluginsCollection();
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (compilationResult) {
      updateData.compilationResult = compilationResult;
    }
    
    await collection.updateOne(
      { userId, pluginId },
      { $set: updateData }
    );
  }

  static async incrementPluginDownload(pluginId: string, userId?: string): Promise<void> {
    const collection = await getUserPluginsCollection();
    
    const updateData: any = {
      $inc: { 
        'analytics.downloadCount': 1 
      },
      $set: { 
        'analytics.lastDownload': new Date(),
        updatedAt: new Date() 
      }
    };
    
    if (userId) {
      updateData.$addToSet = { 'analytics.uniqueUsers': userId };
    }
    
    await collection.updateOne(
      { pluginId },
      updateData
    );
    
    // Update plugin owner's download statistics
    const plugin = await this.getPluginById(pluginId);
    if (plugin) {
      await this.incrementUserStat(plugin.userId, 'totalDownloads', 1);
    }
  }

  // === CONVERSATION MANAGEMENT ===
  static async createConversation(
    userId: string, 
    title: string,
    options?: {
      pluginId?: string;
      pluginName?: string;
      type?: ChatConversation['type'];
      description?: string;
      tags?: string[];
    }
  ): Promise<string> {
    const collection = await getChatConversationsCollection();
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: Omit<ChatConversation, '_id'> = {
      userId,
      pluginId: options?.pluginId,
      pluginName: options?.pluginName,
      title,
      description: options?.description,
      type: options?.type || 'general-help',
      status: 'active',
      isStarred: false,
      tags: options?.tags || [],
      messageCount: 0,
      lastMessageAt: new Date(),
      totalTokensUsed: 0,
      averageResponseTime: 0,
      aiModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne({ ...conversation, _id: conversationId });
    return conversationId;
  }

  static async getConversations(userId: string, options?: {
    pluginId?: string;
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<ChatConversation[]> {
    const collection = await getChatConversationsCollection();
    
    const filter: any = { userId };
    if (options?.pluginId) filter.pluginId = options.pluginId;
    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;
    
    let query = collection.find(filter).sort({ updatedAt: -1 });
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.toArray();
  }

  static async updateConversation(conversationId: string, updates: Partial<ChatConversation>): Promise<void> {
    const collection = await getChatConversationsCollection();
    await collection.updateOne(
      { _id: conversationId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
          lastMessageAt: new Date()
        }
      }
    );
  }

  static async incrementConversationMessage(conversationId: string, tokensUsed: number, responseTime: number): Promise<void> {
    const collection = await getChatConversationsCollection();
    
    // Get current conversation to calculate new average
    const conversation = await collection.findOne({ _id: conversationId });
    if (!conversation) return;
    
    const newMessageCount = conversation.messageCount + 1;
    const newAverageResponseTime = 
      ((conversation.averageResponseTime * conversation.messageCount) + responseTime) / newMessageCount;
    
    await collection.updateOne(
      { _id: conversationId },
      { 
        $inc: { 
          messageCount: 1,
          totalTokensUsed: tokensUsed
        },
        $set: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          averageResponseTime: newAverageResponseTime
        }
      }
    );
  }

  // === CHAT MESSAGE MANAGEMENT ===
  static async saveChatMessage(message: Omit<ChatMessage, '_id' | 'timestamp'>): Promise<string> {
    const collection = await getChatMessagesCollection();
    
    const messageData: Omit<ChatMessage, '_id'> = {
      ...message,
      status: message.status || 'completed',
      isEdited: false,
      timestamp: new Date(),
    };

    const result = await collection.insertOne(messageData);

    // Update conversation statistics
    await this.incrementConversationMessage(
      message.conversationId, 
      message.tokensUsed?.total || 0,
      message.responseTime || 0
    );
    
    // Update user statistics
    await this.incrementUserStat(message.userId, 'totalChatMessages', 1);

    return result.insertedId.toString();
  }

  static async getChatMessages(userId: string, conversationId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<ChatMessage[]> {
    const collection = await getChatMessagesCollection();
    
    let query = collection.find({ userId, conversationId }).sort({ timestamp: 1 });
    
    if (options?.offset) {
      query = query.skip(options.offset);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.toArray();
  }

  static async updateMessage(messageId: string, userId: string, updates: Partial<ChatMessage>): Promise<void> {
    const collection = await getChatMessagesCollection();
    await collection.updateOne(
      { _id: messageId, userId },
      { 
        $set: { 
          ...updates,
          isEdited: true,
          editedAt: new Date()
        } 
      }
    );
  }

  // === USER ACTIVITY TRACKING ===
  static async logUserActivity(
    userId: string,
    type: string,
    action: string,
    targetId?: string | null,
    metadata?: any
  ): Promise<void>;
  static async logUserActivity(activity: Omit<UserActivity, '_id' | 'timestamp' | 'date'>): Promise<void>;
  static async logUserActivity(
    userIdOrActivity: string | Omit<UserActivity, '_id' | 'timestamp' | 'date'>,
    type?: string,
    action?: string,
    targetId?: string | null,
    metadata?: any
  ): Promise<void> {
    const collection = await getUserActivitiesCollection();
    
    let activityData: Omit<UserActivity, '_id'>;
    
    if (typeof userIdOrActivity === 'string') {
      // Called with individual parameters
      activityData = {
        userId: userIdOrActivity,
        type: type as any,
        action: action!,
        description: `User ${action} ${type}${targetId ? ` (${targetId})` : ''}`,
        pluginId: type === 'plugin' ? (targetId || undefined) : undefined,
        conversationId: type === 'conversation' ? (targetId || undefined) : undefined,
        messageId: type === 'message' ? (targetId || undefined) : undefined,
        metadata: {
          success: true,
          ...metadata
        },
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0]
      };
    } else {
      // Called with activity object
      activityData = {
        ...userIdOrActivity,
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
      };
    }

    await collection.insertOne(activityData);
  }

  static async getUserActivities(userId: string, options?: {
    type?: string;
    days?: number;
    limit?: number;
  }): Promise<UserActivity[]> {
    const collection = await getUserActivitiesCollection();
    
    const filter: any = { userId };
    if (options?.type) filter.type = options.type;
    
    if (options?.days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - options.days);
      filter.timestamp = { $gte: daysAgo };
    }
    
    let query = collection.find(filter).sort({ timestamp: -1 });
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.toArray();
  }

  // === ANALYTICS ===
  static async updatePluginAnalytics(pluginId: string, date: string, updates: Partial<PluginAnalytics>): Promise<void> {
    const collection = await getPluginAnalyticsCollection();
    
    await collection.updateOne(
      { pluginId, date },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        },
        $setOnInsert: {
          pluginId,
          date,
          views: 0,
          downloads: 0,
          installs: 0,
          uninstalls: 0,
          uniqueUsers: [],
          countries: {},
          errorRate: 0,
          successfulCompilations: 0,
          failedCompilations: 0,
          averageLoadTime: 0,
          averageExecutionTime: 0,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  // === PLUGIN REVIEWS MANAGEMENT ===
  static async createPluginReview(review: Omit<PluginReview, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collection = await getPluginReviewsCollection();
    
    // Check if user already reviewed this plugin
    const existingReview = await collection.findOne({
      pluginId: review.pluginId,
      userId: review.userId
    });
    
    if (existingReview) {
      throw new Error('User has already reviewed this plugin');
    }
    
    const reviewData: Omit<PluginReview, '_id'> = {
      ...review,
      isVerified: false,
      isEdited: false,
      helpfulCount: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(reviewData);
    
    // Update plugin average rating
    await this.updatePluginRating(review.pluginId);
    
    return result.insertedId.toString();
  }

  static async getPluginReviews(pluginId: string, options?: {
    status?: string;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
  }): Promise<PluginReview[]> {
    const collection = await getPluginReviewsCollection();
    
    const filter: any = { pluginId };
    if (options?.status) filter.status = options.status;
    
    let sortCriteria: any = { createdAt: -1 }; // Default: newest first
    if (options?.sortBy === 'oldest') sortCriteria = { createdAt: 1 };
    else if (options?.sortBy === 'rating') sortCriteria = { rating: -1 };
    else if (options?.sortBy === 'helpful') sortCriteria = { helpfulCount: -1 };
    
    let query = collection.find(filter).sort(sortCriteria);
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.toArray();
  }

  static async updatePluginReview(reviewId: string, userId: string, updates: Partial<PluginReview>): Promise<void> {
    const collection = await getPluginReviewsCollection();
    
    const result = await collection.updateOne(
      { _id: reviewId, userId },
      { 
        $set: { 
          ...updates,
          isEdited: true,
          updatedAt: new Date(),
          editedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0 && updates.rating !== undefined) {
      const review = await collection.findOne({ _id: reviewId });
      if (review) {
        await this.updatePluginRating(review.pluginId);
      }
    }
  }

  static async getUserReviews(userId: string, limit: number = 10, skip: number = 0): Promise<PluginReview[]> {
    const collection = await getPluginReviewsCollection();
    return await collection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  static async deletePluginReview(reviewId: string, userId: string): Promise<boolean> {
    const collection = await getPluginReviewsCollection();
    const result = await collection.deleteOne({ 
      _id: reviewId,
      userId 
    });
    return result.deletedCount > 0;
  }

  static async getPluginReviewById(reviewId: string): Promise<PluginReview | null> {
    const collection = await getPluginReviewsCollection();
    return await collection.findOne({ _id: reviewId });
  }

  // === NEW AND POPULAR PLUGINS ===
  static async getNewPlugins(limit: number = 10): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    return await collection.find({ status: 'success' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async getPopularPlugins(limit: number = 10): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    return await collection.find({ status: 'success' })
      .sort({ 'analytics.downloadCount': -1, 'analytics.installCount': -1 })
      .limit(limit)
      .toArray();
  }

  static async getTrendingPlugins(limit: number = 10): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    // Calculate trending based on recent downloads and views
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await collection.find({ 
      status: 'success',
      updatedAt: { $gte: thirtyDaysAgo }
    })
      .sort({ 
        'analytics.downloadCount': -1, 
        'analytics.viewCount': -1,
        updatedAt: -1 
      })
      .limit(limit)
      .toArray();
  }

  static async getFeaturedPlugins(limit: number = 10): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    return await collection.find({ 
      status: 'success',
      isFeatured: true,
      visibility: 'public'
    })
      .sort({ 'analytics.downloadCount': -1 })
      .limit(limit)
      .toArray();
  }

  static async getRecommendedPlugins(userId: string, limit: number = 10): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    
    // Get user's plugins to understand preferences
    const userPlugins = await this.getUserPlugins(userId, { limit: 10 });
    const userCategories = [...new Set(userPlugins.map(p => p.category))];
    const userTags = [...new Set(userPlugins.flatMap(p => p.tags))];
    
    // Find plugins in similar categories or with similar tags
    const filter: any = {
      status: 'success',
      visibility: 'public',
      userId: { $ne: userId }, // Exclude user's own plugins
    };
    
    if (userCategories.length > 0 || userTags.length > 0) {
      filter.$or = [];
      if (userCategories.length > 0) {
        filter.$or.push({ category: { $in: userCategories } });
      }
      if (userTags.length > 0) {
        filter.$or.push({ tags: { $in: userTags } });
      }
    }
    
    return await collection.find(filter)
      .sort({ 
        'analytics.downloadCount': -1, 
        'analytics.averageRating': -1,
        updatedAt: -1 
      })
      .limit(limit)
      .toArray();
  }

  // === COLLECTION MANAGEMENT ===
  static async createPluginCollection(collection: Omit<PluginCollection, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collectionsCollection = await getPluginCollectionsCollection();
    
    const collectionData: Omit<PluginCollection, '_id'> = {
      ...collection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collectionsCollection.insertOne(collectionData);
    return result.insertedId.toString();
  }

  static async getUserCollections(userId: string, options?: {
    isPublic?: boolean;
    limit?: number;
    includePlugins?: boolean;
  }): Promise<PluginCollection[]> {
    const collection = await getPluginCollectionsCollection();
    
    const filter: any = { userId };
    if (options?.isPublic !== undefined) filter.isPublic = options.isPublic;
    
    let query = collection.find(filter).sort({ updatedAt: -1 });
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const collections = await query.toArray();
    
    if (options?.includePlugins) {
      // Add plugin details to each collection
      const pluginCollection = await getUserPluginsCollection();
      for (const coll of collections) {
        if (coll.pluginIds && coll.pluginIds.length > 0) {
          const plugins = await pluginCollection.find({ pluginId: { $in: coll.pluginIds } }).toArray();
          (coll as any).plugins = plugins;
        }
      }
    }
    
    return collections;
  }

  static async updatePluginCollection(collectionId: string, userId: string, updates: Partial<PluginCollection>): Promise<PluginCollection | null> {
    const collection = await getPluginCollectionsCollection();
    const result = await collection.findOneAndUpdate(
      { 
        _id: collectionId,
        userId 
      },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async deletePluginCollection(collectionId: string, userId: string): Promise<boolean> {
    const collection = await getPluginCollectionsCollection();
    const result = await collection.deleteOne({ 
      _id: collectionId,
      userId 
    });
    return result.deletedCount > 0;
  }

  static async addPluginToCollection(collectionId: string, userId: string, pluginId: string): Promise<boolean> {
    const collection = await getPluginCollectionsCollection();
    const result = await collection.updateOne(
      { _id: collectionId, userId },
      { 
        $addToSet: { pluginIds: pluginId },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  static async removePluginFromCollection(collectionId: string, pluginId: string, userId: string): Promise<boolean> {
    const collection = await getPluginCollectionsCollection();
    const result = await collection.updateOne(
      { 
        _id: collectionId,
        userId,
        pluginIds: pluginId
      },
      { 
        $pull: { pluginIds: pluginId },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  // === PLUGIN RATING HELPER ===
  static async updatePluginRating(pluginId: string): Promise<void> {
    const reviews = await this.getPluginReviews(pluginId, { limit: 1000 });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const collection = await getUserPluginsCollection();
      await collection.updateOne(
        { pluginId },
        {
          $set: {
            'analytics.averageRating': averageRating,
            'analytics.reviewCount': reviews.length,
            updatedAt: new Date()
          }
        }
      );
    }
  }

  // === ADVANCED ANALYTICS ===
  static async getPluginAnalyticsSummary(pluginId: string, days: number = 30): Promise<any> {
    const collection = await getPluginAnalyticsCollection();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
      {
        $match: {
          pluginId,
          date: {
            $gte: startDate.toISOString().split('T')[0],
            $lte: endDate.toISOString().split('T')[0]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalDownloads: { $sum: '$downloads' },
          totalInstalls: { $sum: '$installs' },
          avgLoadTime: { $avg: '$averageLoadTime' },
          avgExecutionTime: { $avg: '$averageExecutionTime' },
          totalErrors: { $sum: '$failedCompilations' },
          totalSuccess: { $sum: '$successfulCompilations' },
          uniqueUsers: { $addToSet: '$uniqueUsers' },
          countries: { $push: '$countries' }
        }
      }
    ];
    
    const result = await collection.aggregate(pipeline).toArray();
    return result[0] || {};
  }

  static async getUserAnalyticsSummary(userId: string): Promise<any> {
    const [plugins, conversations, messages, activities] = await Promise.all([
      this.getUserPlugins(userId),
      this.getConversations(userId),
      this.getChatMessages(userId, '', { limit: 1000 }),
      this.getUserActivities(userId, { days: 30 })
    ]);

    const totalDownloads = plugins.reduce((sum, plugin) => sum + (plugin.analytics?.downloadCount || 0), 0);
    const totalViews = plugins.reduce((sum, plugin) => sum + (plugin.analytics?.viewCount || 0), 0);
    const avgRating = plugins
      .filter(p => p.analytics?.averageRating)
      .reduce((sum, plugin, _, arr) => sum + (plugin.analytics?.averageRating || 0) / arr.length, 0);

    return {
      plugins: {
        total: plugins.length,
        public: plugins.filter(p => p.visibility === 'public').length,
        featured: plugins.filter(p => p.isFeatured).length,
        totalDownloads,
        totalViews,
        averageRating: Math.round(avgRating * 10) / 10
      },
      conversations: {
        total: conversations.length,
        active: conversations.filter(c => c.status === 'active').length,
        starred: conversations.filter(c => c.isStarred).length
      },
      messages: {
        total: messages.length,
        totalTokens: messages.reduce((sum, msg) => sum + (msg.tokensUsed?.total || 0), 0)
      },
      activity: {
        totalActions: activities.length,
        recentLogins: activities.filter(a => a.type === 'login').length
      }
    };
  }

  // === BATCH OPERATIONS ===
  static async batchUpdatePluginStatus(userId: string, pluginIds: string[], status: UserPlugin['status']): Promise<void> {
    const collection = await getUserPluginsCollection();
    await collection.updateMany(
      { userId, pluginId: { $in: pluginIds } },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        } 
      }
    );
  }

  static async batchDeleteConversations(userId: string, conversationIds: string[]): Promise<void> {
    const conversationsCollection = await getChatConversationsCollection();
    const messagesCollection = await getChatMessagesCollection();
    
    await Promise.all([
      conversationsCollection.updateMany(
        { _id: { $in: conversationIds }, userId },
        { 
          $set: { 
            status: 'deleted',
            archivedAt: new Date(),
            updatedAt: new Date()
          }
        }
      ),
      messagesCollection.updateMany(
        { conversationId: { $in: conversationIds }, userId },
        { 
          $set: { 
            status: 'cancelled'
          }
        }
      )
    ]);
  }

  // === SEARCH AND DISCOVERY ===
  static async searchPlugins(searchTerm: string, options?: {
    userId?: string;
    category?: string;
    limit?: number;
    includePrivate?: boolean;
  }): Promise<UserPlugin[]> {
    const collection = await getUserPluginsCollection();
    
    const filter: any = {
      $or: [
        { pluginName: { $regex: searchTerm, $options: 'i' } },
        { displayName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };

    // Add visibility filter unless explicitly including private
    if (!options?.includePrivate) {
      filter.visibility = 'public';
    }

    // Filter by user if specified
    if (options?.userId) {
      filter.userId = options.userId;
    }

    // Filter by category if specified
    if (options?.category) {
      filter.category = options.category;
    }

    // Only include successful plugins for public searches
    if (!options?.userId) {
      filter.status = 'success';
    }

    let query = collection.find(filter);
    
    // Sort by relevance (download count and rating)
    query = query.sort({ 
      'analytics.downloadCount': -1, 
      'analytics.averageRating': -1,
      updatedAt: -1 
    });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query.toArray();
  }

  // === DATA MIGRATION UTILITIES ===
  static async migrateUserData(oldUserId: string, newUserId: string): Promise<void> {
    const collections = [
      await getUserProfilesCollection(),
      await getUserPluginsCollection(),
      await getChatConversationsCollection(),
      await getChatMessagesCollection(),
      await getUserActivitiesCollection(),
      await getPluginAnalyticsCollection(),
      await getPluginReviewsCollection(),
      await getPluginCollectionsCollection()
    ];

    await Promise.all(
      collections.map(collection =>
        collection.updateMany(
          { userId: oldUserId },
          { $set: { userId: newUserId, updatedAt: new Date() } }
        )
      )
    );
  }

  static async exportUserData(userId: string): Promise<any> {
    const [profile, plugins, conversations, messages, activities, reviews, collections] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserPlugins(userId),
      this.getConversations(userId),
      this.getChatMessages(userId, ''),
      this.getUserActivities(userId),
      getPluginReviewsCollection().then(col => col.find({ userId }).toArray()),
      this.getUserCollections(userId)
    ]);

    return {
      exportDate: new Date().toISOString(),
      userId,
      profile,
      plugins,
      conversations,
      messages,
      activities,
      reviews,
      collections
    };
  }

  // === PERFORMANCE MONITORING ===
  static async getSystemMetrics(): Promise<any> {
    const db = await ensureConnection();
    
    const collections = [
      'pegasus_user_profiles',
      'pegasus_user_plugins', 
      'pegasus_chat_conversations',
      'pegasus_chat_messages',
      'pegasus_user_activities',
      'pegasus_plugin_analytics',
      'pegasus_plugin_reviews',
      'pegasus_plugin_collections'
    ];
    
    const metrics: any = {
      timestamp: new Date(),
      collections: {}
    };
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const stats = await db.command({ collStats: collectionName });
      
      metrics.collections[collectionName] = {
        documentCount: stats.count,
        indexCount: stats.nindexes,
        totalSize: stats.size,
        storageSize: stats.storageSize,
        avgDocumentSize: stats.avgObjSize
      };
    }
    
    return metrics;
  }

  // === UTILITY METHODS ===
  static async incrementUserStat(userId: string, field: keyof UserProfile['statistics'], value: number): Promise<void> {
    const collection = await getUserProfilesCollection();
    await collection.updateOne(
      { userId },
      { 
        $inc: { [`statistics.${field}`]: value },
        $set: { 
          'statistics.lastActive': new Date(),
          updatedAt: new Date() 
        }
      }
    );
  }

  static async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversationsCollection = await getChatConversationsCollection();
    const messagesCollection = await getChatMessagesCollection();
    
    // Archive instead of delete for data retention
    await Promise.all([
      conversationsCollection.updateOne(
        { _id: conversationId, userId },
        { 
          $set: { 
            status: 'deleted',
            archivedAt: new Date(),
            updatedAt: new Date()
          }
        }
      ),
      messagesCollection.updateMany(
        { conversationId, userId },
        { 
          $set: { 
            status: 'cancelled'
          }
        }
      )
    ]);
  }

  // === COLLECTION UTILITIES ===

  // === ANALYTICS RECORDING ===
  static async recordPluginAnalytics(pluginId: string, metric: string, value: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const collection = await getPluginAnalyticsCollection();
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Map metrics to fields
    switch (metric) {
      case 'view':
        updateData['$inc'] = { views: value };
        break;
      case 'download':
        updateData['$inc'] = { downloads: value };
        break;
      case 'install':
        updateData['$inc'] = { installs: value };
        break;
      case 'click':
        updateData['$inc'] = { views: value }; // Treat clicks as views
        break;
      default:
        return; // Unknown metric
    }
    
    await collection.updateOne(
      { pluginId, date: today },
      {
        ...updateData,
        $setOnInsert: {
          pluginId,
          date: today,
          views: 0,
          downloads: 0,
          installs: 0,
          uninstalls: 0,
          uniqueUsers: [],
          countries: {},
          errorRate: 0,
          successfulCompilations: 0,
          failedCompilations: 0,
          averageLoadTime: 0,
          averageExecutionTime: 0,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  // === ADMIN METHODS ===
  static async getAllUsersForAdmin(): Promise<any[]> {
    // Since we don't have a dedicated users collection, we'll aggregate from user profiles
    const collection = await getUserProfilesCollection();
    const pluginsCollection = await getUserPluginsCollection();
    
    // Get all user profiles
    const profiles = await collection.find({}).toArray();
    
    // For each profile, get plugin count
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const userPlugins = await pluginsCollection.countDocuments({ userId: profile.userId });
        
        return {
          id: profile.userId,
          email: profile.userId, // Using userId as email for now
          displayName: profile.userId.split('@')[0] || profile.userId,
          role: 'user', // Default role, should be stored in profile
          pluginLimit: profile.subscription?.tier === 'pro' ? 100 : profile.subscription?.tier === 'enterprise' ? 1000 : 25,
          isActive: true, // Default to active
          createdAt: profile.createdAt.toISOString(),
          lastLoginAt: profile.statistics.lastActive.toISOString(),
          totalPlugins: userPlugins
        };
      })
    );
    
    return usersWithStats;
  }

  static async updateUserRole(userId: string, role: 'user' | 'admin' | 'moderator'): Promise<void> {
    const collection = await getUserProfilesCollection();
    
    // Update the user's role in their profile
    await collection.updateOne(
      { userId },
      { 
        $set: { 
          'role': role,
          updatedAt: new Date() 
        }
      },
      { upsert: true }
    );
  }

  static async updateUserPluginLimit(userId: string, pluginLimit: number): Promise<void> {
    const collection = await getUserProfilesCollection();
    
    // Determine subscription tier based on plugin limit
    let tier: 'free' | 'pro' | 'enterprise' = 'free';
    if (pluginLimit > 100) {
      tier = 'enterprise';
    } else if (pluginLimit > 25) {
      tier = 'pro';
    }
    
    await collection.updateOne(
      { userId },
      { 
        $set: { 
          'subscription.tier': tier,
          'subscription.pluginLimit': pluginLimit,
          updatedAt: new Date() 
        }
      },
      { upsert: true }
    );
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    const collection = await getUserProfilesCollection();
    
    await collection.updateOne(
      { userId },
      { 
        $set: { 
          'isActive': isActive,
          updatedAt: new Date() 
        }
      },
      { upsert: true }
    );
  }

  // === MINECRAFT SERVER MANAGEMENT ===
  
  static async createMinecraftServer(config: MinecraftServerConfig): Promise<string> {
    const collection = await getMinecraftServersCollection();
    
    const serverId = `${config.userId}_${config.serverName}`;
    const port = config.port || await this.findAvailablePort(25565);
    
    const serverData: Omit<ServerStatus, '_id'> = {
      id: serverId,
      userId: config.userId,
      status: 'creating',
      port,
      playerCount: 0,
      maxPlayers: config.maxPlayers || 20,
      uptime: 0,
      lastSeen: new Date(),
      lastPlayerActivity: new Date(),
      autoShutdown: true,
      inactiveShutdownMinutes: 10,
      serverName: config.serverName,
      gameMode: config.gameMode || 'survival',
      difficulty: config.difficulty || 'normal',
      pvp: true,
      onlinePlayers: [],
      config,
      analytics: {
        totalPlayers: 0,
        peakPlayerCount: 0,
        totalUptime: 0,
        restartCount: 0,
        lastRestart: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(serverData);
    return result.insertedId.toString();
  }

  static async getMinecraftServer(serverId: string): Promise<ServerStatus | null> {
    const collection = await getMinecraftServersCollection();
    return await collection.findOne({ id: serverId });
  }

  static async getUserMinecraftServers(userId: string): Promise<ServerStatus[]> {
    const collection = await getMinecraftServersCollection();
    return await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  static async updateMinecraftServerStatus(
    serverId: string, 
    updates: Partial<ServerStatus>
  ): Promise<void> {
    const collection = await getMinecraftServersCollection();
    await collection.updateOne(
      { id: serverId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        } 
      }
    );
  }

  static async deleteMinecraftServer(serverId: string): Promise<boolean> {
    const collection = await getMinecraftServersCollection();
    const result = await collection.deleteOne({ id: serverId });
    return result.deletedCount > 0;
  }

  static async startMinecraftServer(serverId: string): Promise<void> {
    await this.updateMinecraftServerStatus(serverId, {
      status: 'starting',
      lastSeen: new Date()
    });
  }

  static async stopMinecraftServer(serverId: string): Promise<void> {
    await this.updateMinecraftServerStatus(serverId, {
      status: 'stopping',
      lastSeen: new Date()
    });
  }

  static async restartMinecraftServer(serverId: string): Promise<void> {
    const collection = await getMinecraftServersCollection();
    await collection.updateOne(
      { id: serverId },
      { 
        $set: { 
          status: 'stopping',
          lastSeen: new Date(),
          updatedAt: new Date()
        },
        $inc: {
          'analytics.restartCount': 1
        }
      }
    );
  }

  static async updateServerPlayerActivity(
    serverId: string, 
    playerCount: number, 
    onlinePlayers: string[]
  ): Promise<void> {
    const collection = await getMinecraftServersCollection();
    const updates: any = {
      playerCount,
      onlinePlayers,
      lastSeen: new Date(),
      updatedAt: new Date()
    };

    if (playerCount > 0) {
      updates.lastPlayerActivity = new Date();
    }

    await collection.updateOne(
      { id: serverId },
      { 
        $set: updates,
        $max: {
          'analytics.peakPlayerCount': playerCount
        }
      }
    );
  }

  static async executeServerCommand(
    serverId: string, 
    userId: string, 
    command: string
  ): Promise<string> {
    const commandsCollection = await getMinecraftServerCommandsCollection();
    
    const commandData: Omit<MinecraftServerCommand, '_id'> = {
      serverId,
      userId,
      command,
      timestamp: new Date(),
      status: 'pending'
    };

    const result = await commandsCollection.insertOne(commandData);
    return result.insertedId.toString();
  }

  static async getServerCommands(
    serverId: string, 
    limit: number = 50
  ): Promise<MinecraftServerCommand[]> {
    const collection = await getMinecraftServerCommandsCollection();
    return await collection
      .find({ serverId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  static async logServerMessage(
    serverId: string, 
    userId: string, 
    level: MinecraftServerLog['level'], 
    message: string, 
    source: MinecraftServerLog['source'] = 'server'
  ): Promise<void> {
    const collection = await getMinecraftServerLogsCollection();
    
    const logData: Omit<MinecraftServerLog, '_id'> = {
      serverId,
      userId,
      level,
      message,
      source,
      timestamp: new Date()
    };

    await collection.insertOne(logData);
  }

  static async getServerLogs(
    serverId: string, 
    options?: {
      level?: MinecraftServerLog['level'];
      source?: MinecraftServerLog['source'];
      limit?: number;
      since?: Date;
    }
  ): Promise<MinecraftServerLog[]> {
    const collection = await getMinecraftServerLogsCollection();
    
    const query: any = { serverId };
    if (options?.level) query.level = options.level;
    if (options?.source) query.source = options.source;
    if (options?.since) query.timestamp = { $gte: options.since };

    return await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 100)
      .toArray();
  }

  static async getServerAnalytics(serverId: string): Promise<any> {
    const server = await this.getMinecraftServer(serverId);
    if (!server) return null;

    const logsCollection = await getMinecraftServerLogsCollection();
    const commandsCollection = await getMinecraftServerCommandsCollection();

    // Get recent activity
    const recentLogs = await logsCollection.countDocuments({
      serverId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const recentCommands = await commandsCollection.countDocuments({
      serverId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    return {
      server: server.analytics,
      recentActivity: {
        logsLast24h: recentLogs,
        commandsLast24h: recentCommands
      },
      status: {
        uptime: server.uptime,
        playerCount: server.playerCount,
        status: server.status
      }
    };
  }

  static async updateAutoShutdownSettings(
    serverId: string,
    settings: { enabled: boolean; inactiveMinutes: number }
  ): Promise<void> {
    await this.updateMinecraftServerStatus(serverId, {
      autoShutdown: settings.enabled,
      inactiveShutdownMinutes: settings.inactiveMinutes
    });
  }

  static async getAllRunningServers(): Promise<ServerStatus[]> {
    const collection = await getMinecraftServersCollection();
    return await collection.find({ status: 'running' }).toArray();
  }

  static async findAvailablePort(startPort: number = 25565): Promise<number> {
    const collection = await getMinecraftServersCollection();
    const usedPorts = await collection.distinct('port');
    
    let port = startPort;
    while (usedPorts.includes(port)) {
      port++;
    }
    return port;
  }

  static async getServersByStatus(status: ServerStatus['status']): Promise<ServerStatus[]> {
    const collection = await getMinecraftServersCollection();
    return await collection.find({ status }).toArray();
  }
  static async getInactiveServers(thresholdMinutes: number = 10): Promise<ServerStatus[]> {
    const collection = await getMinecraftServersCollection();
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    
    return await collection.find({
      status: 'running',
      autoShutdown: true,
      playerCount: 0,
      lastPlayerActivity: { $lt: threshold }
    }).toArray();
  }

  static async getMinecraftServerCommandsCollection() {
    return await getMinecraftServerCommandsCollection();
  }
}
