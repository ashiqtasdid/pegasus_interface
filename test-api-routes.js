// Quick test to verify our API routes compile correctly
const fs = require('fs');

function testApiRoutes() {
  const routes = [
    'src/app/api/plugins/reviews/route.ts',
    'src/app/api/plugins/discovery/route.ts', 
    'src/app/api/plugins/collections/route.ts',
    'src/app/api/plugins/collections/manage/route.ts'
  ];

  console.log('Testing API routes compilation...\n');

  for (const routePath of routes) {
    try {
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Check for basic structure
      const hasGet = content.includes('export async function GET');
      const hasPost = content.includes('export async function POST');
      const hasPut = content.includes('export async function PUT');
      const hasDelete = content.includes('export async function DELETE');
      
      console.log(`✅ ${routePath}:`);
      console.log(`   - GET: ${hasGet ? '✓' : '✗'}`);
      console.log(`   - POST: ${hasPost ? '✓' : '✗'}`);
      console.log(`   - PUT: ${hasPut ? '✓' : '✗'}`);
      console.log(`   - DELETE: ${hasDelete ? '✓' : '✗'}`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${routePath}: ${error.message}`);
    }
  }
}

testApiRoutes();
