import { auth } from './src/lib/auth';

async function setupDatabase() {
  try {
    console.log('Setting up Better Auth database schema...');
    
    // The auth instance will automatically create the necessary collections
    // when first used. We can test this by attempting to create a session.
    const testResult = await auth.api.signUp.email({
      email: 'test@example.com',
      password: 'test123456',
      name: 'Test User',
    });

    console.log('Database setup completed successfully!');
    console.log('Test user created (you can delete this later):', testResult);
    
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
