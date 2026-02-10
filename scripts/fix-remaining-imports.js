const fs = require('fs');

console.log('🔧 Fixing remaining import issues...');

// Fix customPrismaAdapter.ts
const customPrismaAdapterPath = 'app/lib/auth/customPrismaAdapter.ts';
if (fs.existsSync(customPrismaAdapterPath)) {
  let content = fs.readFileSync(customPrismaAdapterPath, 'utf8');
  
  content = content.replace(
    /import prisma from '@\/app\/lib\/database\/prisma';/g,
    "import prisma from '../database/prisma';"
  );
  
  fs.writeFileSync(customPrismaAdapterPath, content, 'utf8');
  console.log('✅ Fixed customPrismaAdapter.ts imports');
}

// Fix bcryptjs import in auth.ts
const authPath = 'app/lib/auth/auth.ts';
if (fs.existsSync(authPath)) {
  let content = fs.readFileSync(authPath, 'utf8');
  
  content = content.replace(
    /import bcrypt from 'bcryptjs';/g,
    "import * as bcrypt from 'bcryptjs';"
  );
  
  fs.writeFileSync(authPath, content, 'utf8');
  console.log('✅ Fixed bcryptjs import in auth.ts');
}

console.log('🎉 Remaining imports fix complete!');
