import { connectToDatabase } from './src/lib/database';

// Function to initialize database connection
async function initialize() {
  try {
    console.log('Initializing application...');
    await connectToDatabase();
    console.log('Application initialization complete');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Don't throw here - allow the application to start even if db connection fails
  }
}

// Run initialization
initialize();
