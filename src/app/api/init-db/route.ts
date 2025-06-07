import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { initializeDatabase, databaseHealthCheck } from '@/lib/database-indexes';

// This route initializes the comprehensive database structure with indexes and validation
export async function GET() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Test database connection
    await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully');
    
    // Check current database status
    const healthCheck = await databaseHealthCheck();
    console.log('📊 Database health check:', healthCheck);
    
    // Initialize database (create indexes and validation)
    await initializeDatabase();
    
    // Final health check
    const finalCheck = await databaseHealthCheck();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully with comprehensive schema',
      database: 'better-auth',
      initialHealth: healthCheck,
      finalHealth: finalCheck,
      features: [
        'User profiles with preferences and analytics',
        'Hierarchical plugin management with versioning',
        'Enhanced chat system with AI metadata',
        'Comprehensive user activity tracking',
        'Plugin analytics and performance metrics',
        'Review and rating system',
        'Plugin collections and curation',
        'Optimized indexes for fast queries',
        'Schema validation for data integrity'
      ],
      collections: {
        'pegasus_user_profiles': 'User preferences, subscription, and statistics',
        'pegasus_user_plugins': 'Plugin metadata, files, versions, and analytics',
        'pegasus_chat_conversations': 'Chat conversation management with AI context',
        'pegasus_chat_messages': 'Individual messages with rich metadata',
        'pegasus_user_activities': 'User activity tracking and analytics',
        'pegasus_plugin_analytics': 'Plugin usage and performance metrics',
        'pegasus_plugin_reviews': 'User reviews and ratings',
        'pegasus_plugin_collections': 'User-curated plugin collections'
      },
      indexes: {
        total: 50,
        categories: [
          'Primary key indexes',
          'Compound query indexes', 
          'Text search indexes',
          'Analytics optimization indexes',
          'Time-based TTL indexes'
        ]
      },
      validation: {
        enabled: true,
        collections: [
          'pegasus_user_plugins',
          'pegasus_chat_conversations', 
          'pegasus_chat_messages'
        ],
        features: [
          'Required field validation',
          'Data type enforcement',
          'Enum value validation',
          'String pattern matching',
          'Numeric range validation'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Health check endpoint
export async function POST() {
  try {
    const healthCheck = await databaseHealthCheck();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...healthCheck
    });
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}