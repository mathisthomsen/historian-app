const fs = require('fs');

console.log('🔧 Fixing import paths in person-event-relations API...');

const filePath = 'app/api/person-event-relations/route.ts';

if (!fs.existsSync(filePath)) {
  console.log(`⚠️  File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Fix the import paths
content = content.replace(
  /import prisma from '@\/app\/lib\/database\/prisma';/g,
  "import prisma from '../../lib/database/prisma';"
);

content = content.replace(
  /import { requireUser } from '\.\.\/\.\.\/lib\/auth\/requireUser';/g,
  "import { requireUser } from '../../lib/auth/requireUser';"
);

content = content.replace(
  /import { RateLimiter } from '\.\.\/\.\.\/lib\/utils\/validation';/g,
  "import { RateLimiter } from '../../lib/utils/validation';"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed import paths in person-event-relations API');
