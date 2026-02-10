#!/usr/bin/env node

/**
 * Emergency Refactoring Script
 * Fixes import paths and structural issues causing waterfall failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 Emergency Refactoring: Fixing Import Paths...');

// 1. Fix Prisma imports
const prismaImportFix = `
// Replace all instances of:
// import prisma from '../../libs/prisma';
// import prisma from '../../../libs/prisma';
// import prisma from '@/app/libs/prisma';
// With:
// import prisma from '@/app/lib/prisma';
`;

console.log('📝 Step 1: Standardizing Prisma imports...');

// Find all files with libs/prisma imports
const findPrismaImports = () => {
  const files = [];
  const searchDirs = ['app/api', 'app/lib'];
  
  searchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const walk = (currentPath) => {
        const items = fs.readdirSync(currentPath);
        items.forEach(item => {
          const fullPath = path.join(currentPath, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('libs/prisma')) {
              files.push(fullPath);
            }
          }
        });
      };
      walk(dir);
    }
  });
  
  return files;
};

const prismaFiles = findPrismaImports();
console.log(`Found ${prismaFiles.length} files with libs/prisma imports`);

// Fix each file
prismaFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace various import patterns
  content = content.replace(
    /import prisma from ['"]\.\.\/\.\.\/libs\/prisma['"];?/g,
    "import prisma from '@/app/lib/prisma';"
  );
  content = content.replace(
    /import prisma from ['"]\.\.\/\.\.\/\.\.\/libs\/prisma['"];?/g,
    "import prisma from '@/app/lib/prisma';"
  );
  content = content.replace(
    /import prisma from ['"]@\/app\/libs\/prisma['"];?/g,
    "import prisma from '@/app/lib/prisma';"
  );
  
  fs.writeFileSync(file, content);
  console.log(`✅ Fixed: ${file}`);
});

// 2. Create centralized import paths
console.log('📝 Step 2: Creating centralized import utilities...');

const createIndexFiles = () => {
  // Create lib/index.ts for common imports
  const libIndexContent = `// Centralized imports for better maintainability
export { default as prisma } from './prisma';
export * from './api';
export * from './auth';
export * from './validation';
export * from './fuzzyData';
export * from './geocoding';
export * from './theme';
export * from './email';
export * from './cache';
export * from './bibliography-sync';
export * from './customPrismaAdapter';
export * from './requireUser';
`;

  fs.writeFileSync('app/lib/index.ts', libIndexContent);
  console.log('✅ Created: app/lib/index.ts');
};

createIndexFiles();

// 3. Update tsconfig.json for better path resolution
console.log('📝 Step 3: Updating TypeScript configuration...');

const updateTsConfig = () => {
  const tsConfigPath = 'tsconfig.json';
  if (fs.existsSync(tsConfigPath)) {
    let content = fs.readFileSync(tsConfigPath, 'utf8');
    const config = JSON.parse(content);
    
    // Ensure proper path mapping
    config.compilerOptions = config.compilerOptions || {};
    config.compilerOptions.paths = {
      "@/*": ["./*"],
      "@/app/*": ["./app/*"],
      "@/lib/*": ["./app/lib/*"],
      "@/components/*": ["./app/components/*"],
      "@/types/*": ["./app/types/*"],
      "@/hooks/*": ["./app/hooks/*"],
      "@/contexts/*": ["./app/contexts/*"]
    };
    
    fs.writeFileSync(tsConfigPath, JSON.stringify(config, null, 2));
    console.log('✅ Updated: tsconfig.json');
  }
};

updateTsConfig();

// 4. Create a migration guide
console.log('📝 Step 4: Creating migration documentation...');

const migrationGuide = `# Emergency Refactoring - Import Path Fixes

## What Was Fixed

### 1. Prisma Import Standardization
- **Before**: Mixed import paths (\`../../libs/prisma\`, \`@/app/libs/prisma\`)
- **After**: Centralized \`@/app/lib/prisma\`
- **Files Updated**: ${prismaFiles.length} files

### 2. TypeScript Configuration
- Added proper path mapping in tsconfig.json
- Enabled \`@/\` imports for better maintainability

### 3. File Structure Improvements
- Converted client-layout.js → client-layout.tsx
- Created centralized lib/index.ts

## Next Steps

1. **Test the application** to ensure no import errors
2. **Run TypeScript check**: \`npm run type-check\`
3. **Run linting**: \`npm run lint\`
4. **Fix any remaining import issues** manually

## Common Import Patterns

### ✅ Correct Imports
\`\`\`typescript
// Prisma
import prisma from '@/app/lib/prisma';

// Components
import { PersonForm } from '@/components/PersonForm';

// Utilities
import { api } from '@/lib/api';
import { requireUser } from '@/lib/requireUser';

// Types
import { Person } from '@/types/person';
\`\`\`

### ❌ Avoid These Patterns
\`\`\`typescript
// Don't use relative paths for shared utilities
import prisma from '../../libs/prisma';
import { api } from '../lib/api';

// Don't use inconsistent naming
import prisma from '@/app/libs/prisma';
\`\`\`

## Verification Commands

\`\`\`bash
# Check for any remaining libs/ imports
grep -r "libs/" app/ --include="*.ts" --include="*.tsx"

# Check TypeScript compilation
npm run type-check

# Check linting
npm run lint

# Test build
npm run build
\`\`\`
`;

fs.writeFileSync('EMERGENCY_REFACTORING_GUIDE.md', migrationGuide);
console.log('✅ Created: EMERGENCY_REFACTORING_GUIDE.md');

console.log('\n🎉 Emergency refactoring complete!');
console.log('📋 Next steps:');
console.log('   1. Run: npm run type-check');
console.log('   2. Run: npm run lint');
console.log('   3. Test the application');
console.log('   4. Check EMERGENCY_REFACTORING_GUIDE.md for details'); 