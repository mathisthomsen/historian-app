const fs = require('fs');

console.log('🔧 Fixing import paths in lib files...');

// Fix auth.ts
const authPath = 'app/lib/auth/auth.ts';
if (fs.existsSync(authPath)) {
  let content = fs.readFileSync(authPath, 'utf8');
  
  content = content.replace(
    /import { CustomPrismaAdapter } from '@\/app\/lib\/auth\/customPrismaAdapter';/g,
    "import { CustomPrismaAdapter } from './customPrismaAdapter';"
  );
  
  content = content.replace(
    /import prisma from '@\/app\/lib\/database\/prisma';/g,
    "import prisma from '../database/prisma';"
  );
  
  fs.writeFileSync(authPath, content, 'utf8');
  console.log('✅ Fixed auth.ts imports');
}

// Fix validation.ts
const validationPath = 'app/lib/utils/validation.ts';
if (fs.existsSync(validationPath)) {
  let content = fs.readFileSync(validationPath, 'utf8');
  
  // Fix the MapIterator issue by using Array.from
  content = content.replace(
    /for \(const \[identifier, requests\] of this\.requests\.entries\(\)\) \{/g,
    'for (const [identifier, requests] of Array.from(this.requests.entries())) {'
  );
  
  fs.writeFileSync(validationPath, content, 'utf8');
  console.log('✅ Fixed validation.ts imports');
}

console.log('🎉 Lib imports fix complete!');
