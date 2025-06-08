const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/minecraft/servers/[id]/start/route.ts',
  'src/app/api/minecraft/servers/[id]/stop/route.ts', 
  'src/app/api/minecraft/servers/[id]/restart/route.ts',
  'src/app/api/minecraft/servers/[id]/players/route.ts',
  'src/app/api/minecraft/servers/[id]/command/route.ts',
  'src/app/api/minecraft/servers/[id]/logs/route.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix Params interface
    content = content.replace(
      /interface Params {\s*params: {\s*id: string;\s*};\s*}/g,
      'interface Params {\n  params: Promise<{\n    id: string;\n  }>;\n}'
    );
    
    // Fix params usage in function signatures  
    content = content.replace(
      /(export async function \w+\(request: NextRequest, { params }: Params\) {\s*try {\s*)(const session = await auth\.api\.getSession\({[\s\S]*?\}\);[\s\S]*?)(const { id: serverId } = params;)/g,
      '$1const { id: serverId } = await params;\n    $2'
    );

    // Alternative pattern for functions that have different order
    content = content.replace(
      /(const { id: serverId } = params;)/g,
      'const { id: serverId } = await params;'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});
