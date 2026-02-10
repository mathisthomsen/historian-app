#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing import paths after reorganization...');

// Find all TypeScript and JavaScript files
const findFiles = (dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) => {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
};

// Import path mappings
const importMappings = [
  // Prisma imports
  { from: '@/app/lib/prisma', to: '@/app/lib/database/prisma' },
  { from: '../../lib/prisma', to: '../../lib/database/prisma' },
  { from: '../lib/prisma', to: '../lib/database/prisma' },
  { from: './lib/prisma', to: './lib/database/prisma' },
  
  // API imports
  { from: '@/app/lib/api', to: '@/app/lib/api/api' },
  { from: '../../lib/api', to: '../../lib/api/api' },
  { from: '../lib/api', to: '../lib/api/api' },
  { from: './lib/api', to: './lib/api/api' },
  
  // Auth imports
  { from: '@/app/lib/auth', to: '@/app/lib/auth/auth' },
  { from: '../../lib/auth', to: '../../lib/auth/auth' },
  { from: '../lib/auth', to: '../lib/auth/auth' },
  { from: './lib/auth', to: './lib/auth/auth' },
  
  // Validation imports
  { from: '@/app/lib/validation', to: '@/app/lib/utils/validation' },
  { from: '../../lib/validation', to: '../../lib/utils/validation' },
  { from: '../lib/validation', to: '../lib/utils/validation' },
  { from: './lib/validation', to: './lib/utils/validation' },
  
  // Fuzzy data imports
  { from: '@/app/lib/fuzzyData', to: '@/app/lib/utils/fuzzyData' },
  { from: '../../lib/fuzzyData', to: '../../lib/utils/fuzzyData' },
  { from: '../lib/fuzzyData', to: '../lib/utils/fuzzyData' },
  { from: './lib/fuzzyData', to: './lib/utils/fuzzyData' },
  
  // Geocoding imports
  { from: '@/app/lib/geocoding', to: '@/app/lib/services/geocoding' },
  { from: '../../lib/geocoding', to: '../../lib/services/geocoding' },
  { from: '../lib/geocoding', to: '../lib/services/geocoding' },
  { from: './lib/geocoding', to: './lib/services/geocoding' },
  
  // Theme imports
  { from: '@/app/lib/theme', to: '@/app/lib/config/theme' },
  { from: '../../lib/theme', to: '../../lib/config/theme' },
  { from: '../lib/theme', to: '../lib/config/theme' },
  { from: './lib/theme', to: './lib/config/theme' },
  
  // Email imports
  { from: '@/app/lib/email', to: '@/app/lib/services/email' },
  { from: '../../lib/email', to: '../../lib/services/email' },
  { from: '../lib/email', to: '../lib/services/email' },
  { from: './lib/email', to: './lib/services/email' },
  
  // Cache imports
  { from: '@/app/lib/cache', to: '@/app/lib/utils/cache' },
  { from: '../../lib/cache', to: '../../lib/utils/cache' },
  { from: '../lib/cache', to: '../lib/utils/cache' },
  { from: './lib/cache', to: './lib/utils/cache' },
  
  // Bibliography sync imports
  { from: '@/app/lib/bibliography-sync', to: '@/app/lib/services/bibliography-sync' },
  { from: '../../lib/bibliography-sync', to: '../../lib/utils/bibliography-sync' },
  { from: '../lib/bibliography-sync', to: '../lib/services/bibliography-sync' },
  { from: './lib/bibliography-sync', to: './lib/services/bibliography-sync' },
  
  // Custom Prisma Adapter imports
  { from: '@/app/lib/customPrismaAdapter', to: '@/app/lib/auth/customPrismaAdapter' },
  { from: '../../lib/customPrismaAdapter', to: '../../lib/auth/customPrismaAdapter' },
  { from: '../lib/customPrismaAdapter', to: '../lib/auth/customPrismaAdapter' },
  { from: './lib/customPrismaAdapter', to: './lib/auth/customPrismaAdapter' },
  
  // Require User imports
  { from: '@/app/lib/requireUser', to: '@/app/lib/auth/requireUser' },
  { from: '../../lib/requireUser', to: '../../lib/auth/requireUser' },
  { from: '../lib/requireUser', to: '../lib/auth/requireUser' },
  { from: './lib/requireUser', to: './lib/auth/requireUser' },
  
  // Component imports - fix relative paths
  { from: '../components/', to: '../../components/' },
  { from: './components/', to: '../components/' },
  
  // Context imports
  { from: '../contexts/', to: '../../contexts/' },
  { from: './contexts/', to: '../contexts/' },
  
  // Hooks imports
  { from: '../hooks/', to: '../../hooks/' },
  { from: './hooks/', to: '../hooks/' },
  
  // Types imports
  { from: '../types/', to: '../../types/' },
  { from: './types/', to: '../types/' },
];

// Fix imports in a file
const fixImportsInFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    importMappings.forEach(mapping => {
      const regex = new RegExp(`from\\s+['"]${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `from '${mapping.to}'`);
        modified = true;
        console.log(`✅ Fixed: ${filePath} - ${mapping.from} -> ${mapping.to}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
};

// Main execution
try {
  const files = findFiles('./app');
  console.log(`📁 Found ${files.length} files to process...`);
  
  files.forEach(fixImportsInFile);
  
  console.log('🎉 Import path fixing complete!');
  console.log('📋 Next steps:');
  console.log('   1. Run: npm run type-check');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the application');
  
} catch (error) {
  console.error('❌ Error during import fixing:', error);
  process.exit(1);
} 