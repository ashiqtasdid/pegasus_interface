import { connectToDatabase } from './database';

/**
 * Database Index Management
 * Creates optimized indexes for all collections to ensure fast queries
 */

export async function createDatabaseIndexes() {
  try {
    const { db } = await connectToDatabase();
    console.log('Creating database indexes...');

    // === USER PROFILES INDEXES ===
    const userProfilesCollection = db.collection('pegasus_user_profiles');
    await userProfilesCollection.createIndexes([
      { key: { userId: 1 }, unique: true },
      { key: { 'subscription.tier': 1 } },
      { key: { 'statistics.lastActive': -1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } }
    ]);

    // === USER PLUGINS INDEXES ===
    const userPluginsCollection = db.collection('pegasus_user_plugins');
    await userPluginsCollection.createIndexes([
      { key: { userId: 1 } },
      { key: { pluginId: 1 }, unique: true },
      { key: { userId: 1, pluginName: 1 } },
      { key: { category: 1 } },
      { key: { status: 1 } },
      { key: { visibility: 1 } },
      { key: { tags: 1 } },
      { key: { isFeatured: 1 } },
      { key: { 'analytics.downloadCount': -1 } },
      { key: { 'analytics.viewCount': -1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      { key: { lastModified: -1 } },
      { key: { publishedAt: -1 } },
      // Compound indexes for common queries
      { key: { category: 1, visibility: 1, 'analytics.downloadCount': -1 } },
      { key: { userId: 1, status: 1, updatedAt: -1 } },
      { key: { visibility: 1, isFeatured: 1, 'analytics.downloadCount': -1 } },
      // Text search index
      { 
        key: { 
          pluginName: 'text', 
          displayName: 'text', 
          description: 'text',
          tags: 'text'
        },
        name: 'plugin_search_index'
      }
    ]);

    // === CHAT CONVERSATIONS INDEXES ===
    const chatConversationsCollection = db.collection('pegasus_chat_conversations');
    await chatConversationsCollection.createIndexes([
      { key: { userId: 1 } },
      { key: { pluginId: 1 } },
      { key: { type: 1 } },
      { key: { status: 1 } },
      { key: { isStarred: 1 } },
      { key: { tags: 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      { key: { lastMessageAt: -1 } },
      // Compound indexes
      { key: { userId: 1, status: 1, updatedAt: -1 } },
      { key: { userId: 1, pluginId: 1, updatedAt: -1 } },
      { key: { userId: 1, type: 1, updatedAt: -1 } }
    ]);

    // === CHAT MESSAGES INDEXES ===
    const chatMessagesCollection = db.collection('pegasus_chat_messages');
    await chatMessagesCollection.createIndexes([
      { key: { userId: 1 } },
      { key: { conversationId: 1 } },
      { key: { role: 1 } },
      { key: { messageType: 1 } },
      { key: { status: 1 } },
      { key: { timestamp: -1 } },
      { key: { aiModel: 1 } },
      // Compound indexes for conversation queries
      { key: { userId: 1, conversationId: 1, timestamp: 1 } },
      { key: { conversationId: 1, status: 1, timestamp: 1 } }
    ]);

    // === USER ACTIVITIES INDEXES ===
    const userActivitiesCollection = db.collection('pegasus_user_activities');
    await userActivitiesCollection.createIndexes([
      { key: { userId: 1 } },
      { key: { type: 1 } },
      { key: { date: 1 } },
      { key: { timestamp: -1 } },
      { key: { pluginId: 1 } },
      { key: { conversationId: 1 } },
      // Compound indexes for analytics
      { key: { userId: 1, type: 1, timestamp: -1 } },
      { key: { userId: 1, date: 1 } },
      { key: { pluginId: 1, type: 1, timestamp: -1 } },
      // TTL index to automatically delete old activities (optional)
      { key: { timestamp: 1 }, expireAfterSeconds: 60 * 60 * 24 * 365 } // 1 year
    ]);

    // === PLUGIN ANALYTICS INDEXES ===
    const pluginAnalyticsCollection = db.collection('pegasus_plugin_analytics');
    await pluginAnalyticsCollection.createIndexes([
      { key: { pluginId: 1 } },
      { key: { userId: 1 } },
      { key: { date: 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      // Compound indexes
      { key: { pluginId: 1, date: 1 }, unique: true },
      { key: { userId: 1, date: 1 } },
      { key: { pluginId: 1, date: -1 } }
    ]);

    // === PLUGIN REVIEWS INDEXES ===
    const pluginReviewsCollection = db.collection('pegasus_plugin_reviews');
    await pluginReviewsCollection.createIndexes([
      { key: { pluginId: 1 } },
      { key: { userId: 1 } },
      { key: { authorId: 1 } },
      { key: { rating: 1 } },
      { key: { status: 1 } },
      { key: { isVerified: 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      // Compound indexes
      { key: { pluginId: 1, status: 1, rating: -1 } },
      { key: { userId: 1, pluginId: 1 }, unique: true }, // One review per user per plugin
      { key: { authorId: 1, createdAt: -1 } }
    ]);

    // === PLUGIN COLLECTIONS INDEXES ===
    const pluginCollectionsCollection = db.collection('pegasus_plugin_collections');
    await pluginCollectionsCollection.createIndexes([
      { key: { userId: 1 } },
      { key: { isPublic: 1 } },
      { key: { tags: 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      { key: { viewCount: -1 } },
      { key: { followerCount: -1 } },
      // Compound indexes
      { key: { userId: 1, isPublic: 1, updatedAt: -1 } },
      { key: { isPublic: 1, followerCount: -1 } }
    ]);

    console.log('✅ Database indexes created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create database indexes:', error);
    throw error;
  }
}

/**
 * Schema Validation Rules
 * MongoDB schema validation to ensure data integrity
 */
export async function createSchemaValidation() {
  try {
    const { db } = await connectToDatabase();
    console.log('Creating schema validation rules...');

    // === USER PLUGINS VALIDATION ===
    await db.command({
      collMod: 'pegasus_user_plugins',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'pluginId', 'pluginName', 'displayName', 'category', 'status'],
          properties: {
            userId: { bsonType: 'string' },
            pluginId: { bsonType: 'string' },
            pluginName: { 
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9_-]+$',
              minLength: 1,
              maxLength: 100
            },
            displayName: {
              bsonType: 'string',
              minLength: 1,
              maxLength: 200
            },
            description: {
              bsonType: 'string',
              maxLength: 2000
            },
            category: {
              enum: ['utility', 'automation', 'development', 'ui', 'data', 'other']
            },
            tags: {
              bsonType: 'array',
              items: { bsonType: 'string' },
              maxItems: 10
            },
            status: {
              enum: ['pending', 'compiling', 'success', 'failed', 'deprecated']
            },
            visibility: {
              enum: ['private', 'public', 'unlisted']
            },
            metadata: {
              bsonType: 'object',
              required: ['version', 'author'],
              properties: {
                version: { 
                  bsonType: 'string',
                  pattern: '^\\d+\\.\\d+\\.\\d+$'
                },
                author: { bsonType: 'string' },
                license: { bsonType: 'string' },
                dependencies: {
                  bsonType: 'array',
                  items: { bsonType: 'string' }
                },
                permissions: {
                  bsonType: 'array',
                  items: { bsonType: 'string' }
                },
                fileSize: { 
                  bsonType: 'number',
                  minimum: 0
                }
              }
            },
            analytics: {
              bsonType: 'object',
              properties: {
                downloadCount: { 
                  bsonType: 'number',
                  minimum: 0
                },
                viewCount: { 
                  bsonType: 'number',
                  minimum: 0
                },
                averageRating: {
                  bsonType: 'number',
                  minimum: 1,
                  maximum: 5
                }
              }
            }
          }
        }
      },
      validationLevel: 'strict',
      validationAction: 'error'
    });

    // === CHAT CONVERSATIONS VALIDATION ===
    await db.command({
      collMod: 'pegasus_chat_conversations',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'title', 'type', 'status'],
          properties: {
            userId: { bsonType: 'string' },
            pluginId: { bsonType: 'string' },
            title: {
              bsonType: 'string',
              minLength: 1,
              maxLength: 200
            },
            type: {
              enum: ['plugin-development', 'general-help', 'debugging', 'feature-request']
            },
            status: {
              enum: ['active', 'archived', 'deleted']
            },
            messageCount: {
              bsonType: 'number',
              minimum: 0
            },
            totalTokensUsed: {
              bsonType: 'number',
              minimum: 0
            },
            temperature: {
              bsonType: 'number',
              minimum: 0,
              maximum: 2
            },
            maxTokens: {
              bsonType: 'number',
              minimum: 1,
              maximum: 32000
            }
          }
        }
      },
      validationLevel: 'strict',
      validationAction: 'error'
    });

    // === CHAT MESSAGES VALIDATION ===
    await db.command({
      collMod: 'pegasus_chat_messages',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['conversationId', 'userId', 'message', 'response', 'role'],
          properties: {
            conversationId: { bsonType: 'string' },
            userId: { bsonType: 'string' },
            message: {
              bsonType: 'string',
              minLength: 1,
              maxLength: 10000
            },
            response: {
              bsonType: 'string',
              maxLength: 50000
            },
            role: {
              enum: ['user', 'assistant', 'system']
            },
            messageType: {
              enum: ['info', 'modification', 'question', 'command', 'error']
            },
            status: {
              enum: ['pending', 'completed', 'failed', 'cancelled']
            },
            tokensUsed: {
              bsonType: 'object',
              properties: {
                input: { bsonType: 'number', minimum: 0 },
                output: { bsonType: 'number', minimum: 0 },
                total: { bsonType: 'number', minimum: 0 }
              }
            },
            responseTime: {
              bsonType: 'number',
              minimum: 0
            },
            feedback: {
              bsonType: 'object',
              properties: {
                rating: {
                  bsonType: 'number',
                  minimum: 1,
                  maximum: 5
                },
                helpful: { bsonType: 'bool' }
              }
            }
          }
        }
      },
      validationLevel: 'strict',
      validationAction: 'error'
    });

    console.log('✅ Schema validation rules created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create schema validation:', error);
    throw error;
  }
}

/**
 * Initialize Database
 * Creates indexes and validation rules for optimal performance and data integrity
 */
export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    await createDatabaseIndexes();
    await createSchemaValidation();
    
    console.log('✅ Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Database Health Check
 * Verifies database connection and collection status
 */
export async function databaseHealthCheck() {
  try {
    const { db } = await connectToDatabase();
    
    // Check collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'pegasus_user_profiles',
      'pegasus_user_plugins', 
      'pegasus_chat_conversations',
      'pegasus_chat_messages',
      'pegasus_user_activities',
      'pegasus_plugin_analytics',
      'pegasus_plugin_reviews',
      'pegasus_plugin_collections'
    ];
    
    const missingCollections = requiredCollections.filter(
      name => !collectionNames.includes(name)
    );
    
    // Get basic statistics
    const stats = {
      totalCollections: collections.length,
      requiredCollections: requiredCollections.length,
      missingCollections,
      collections: {} as Record<string, { documentCount: number }>
    };
    
    // Get document counts for each collection
    for (const collectionName of requiredCollections) {
      if (collectionNames.includes(collectionName)) {
        const count = await db.collection(collectionName).countDocuments();
        stats.collections[collectionName] = { documentCount: count };
      }
    }
    
    return {
      status: missingCollections.length === 0 ? 'healthy' : 'needs_setup',
      ...stats
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
