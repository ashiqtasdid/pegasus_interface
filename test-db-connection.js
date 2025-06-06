// Test database connection
import { connectToDatabase } from './src/lib/database.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const { client, db } = await connectToDatabase();
    console.log('✅ Connected successfully!');
    console.log('Database name:', db.databaseName);
    
    // List collections to verify we can interact with the database
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('✅ Connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

testConnection();
