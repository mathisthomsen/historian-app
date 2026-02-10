#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final import path and component fixes...');

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

// Final import path mappings
const finalMappings = [
  // Missing component imports
  { from: '../../components/ProjectForm', to: '../../components/forms/ProjectForm' },
  { from: '../components/ChartsEvents', to: '../components/data/ChartsEvents' },
  { from: '../components/layout/ErrorBoundary', to: '../components/layout/ErrorBoundary' },
  { from: './components/layout/ErrorBoundary', to: './components/layout/ErrorBoundary' },
  
  // API import fixes
  { from: '../lib/api/api', to: '../lib/api' },
  { from: '../../lib/api/api', to: '../../lib/api' },
  { from: '../../../lib/api/api', to: '../../../lib/api' },
  
  // Bibliography sync fixes
  { from: '../../../lib/bibliography-sync', to: '../../../lib/services/bibliography-sync' },
  { from: '../../lib/utils/bibliography-sync', to: '../../lib/services/bibliography-sync' },
  
  // Fuzzy data fixes
  { from: '../../../lib/fuzzyData', to: '../../../lib/utils/fuzzyData' },
  { from: '../lib/utils/fuzzyData', to: '../lib/utils/fuzzyData' },
  
  // Geocoding fixes
  { from: '../../../lib/geocoding', to: '../../../lib/services/geocoding' },
  
  // Email fixes
  { from: '../../../lib/email', to: '../../../lib/services/email' },
  
  // Context and hooks fixes
  { from: '../../contexts/ProjectContext', to: '../contexts/ProjectContext' },
  { from: '../../hooks/useProjectApi', to: '../hooks/useProjectApi' },
  { from: '../../types/project', to: '../types/project' },
  
  // Test imports
  { from: '../../app/lib/validation', to: '../../app/lib/utils/validation' },
  { from: '../../app/lib/fuzzyData', to: '../../app/lib/utils/fuzzyData' },
  { from: '../../app/components/BulkEditModal', to: '../../app/components/ui/BulkEditModal' },
  { from: '../../app/components/ImportHistory', to: '../../app/components/data/ImportHistory' },
  { from: '../../app/components/PersonForm', to: '../../app/components/forms/PersonForm' },
  { from: '../../app/components/ImportPersons', to: '../../app/components/data/ImportPersons' },
  { from: '../../app/components/ImportEvents', to: '../../app/components/data/ImportEvents' },
  { from: '../../app/components/LifeEventForm', to: '../../app/components/forms/LifeEventForm' },
];

// Fix imports in a file
const fixImportsInFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    finalMappings.forEach(mapping => {
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

// Fix specific issues in files
const fixSpecificIssues = () => {
  // Fix bibliographySync -> bibliography_syncs in mendeley callback
  try {
    const filePath = 'app/api/auth/mendeley/callback/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/prisma\.bibliographySync/g, 'prisma.bibliography_syncs');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: bibliographySync -> bibliography_syncs in mendeley callback');
  } catch (error) {
    console.error('❌ Error fixing bibliographySync:', error.message);
  }
  
  // Fix users -> user in projects members route
  try {
    const filePath = 'app/api/projects/[id]/members/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/users:\s*{/g, 'user: {');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: users -> user in projects members route');
  } catch (error) {
    console.error('❌ Error fixing users -> user:', error.message);
  }
  
  // Remove life_events references from locations/manage/route.ts
  try {
    const filePath = 'app/api/locations/manage/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove life_events from _count select
    content = content.replace(/life_events:\s*true,?\s*/g, '');
    
    // Remove lifeEvents from the return object
    content = content.replace(/lifeEvents:\s*loc\._count\.life_events,?\s*/g, '');
    
    // Fix the total calculation
    content = content.replace(/total:\s*loc\._count\.events\s*\+\s*loc\._count\.life_events\s*\+\s*loc\._count\.birth_persons\s*\+\s*loc\._count\.death_persons/g, 
                             'total: loc._count.events + loc._count.birth_persons + loc._count.death_persons');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed life_events references from locations/manage/route.ts');
  } catch (error) {
    console.error('❌ Error fixing life_events references:', error.message);
  }
  
  // Remove life_events references from locations/route.ts
  try {
    const filePath = 'app/api/locations/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove life_events queries
    content = content.replace(/prisma\.life_events\.findMany\({[\s\S]*?}\);/g, '');
    content = content.replace(/prisma\.life_events\.count\({[\s\S]*?}\);/g, '');
    content = content.replace(/prisma\.life_events\.findFirst\({[\s\S]*?}\);/g, '');
    
    // Fix the locations array construction
    content = content.replace(/\.\.\.lifeEventLocations\.map\(le\s*=>\s*le\.location\)\.filter\(Boolean\)/g, '');
    
    // Fix the total calculation
    content = content.replace(/total:\s*eventCount\s*\+\s*lifeEventCount/g, 'total: eventCount');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed life_events references from locations/route.ts');
  } catch (error) {
    console.error('❌ Error fixing life_events references in locations route:', error.message);
  }
  
  // Remove life_events references from projects stats route
  try {
    const filePath = 'app/api/projects/[id]/stats/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove life_events count
    content = content.replace(/prisma\.life_events\.count\({[\s\S]*?}\);/g, '');
    
    // Remove lifeEventsCount from the return object
    content = content.replace(/lifeEventsCount,\s*/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed life_events references from projects stats route');
  } catch (error) {
    console.error('❌ Error fixing life_events references in projects stats:', error.message);
  }
};

// Main execution
try {
  const files = findFiles('./app');
  console.log(`📁 Found ${files.length} files to process...`);
  
  files.forEach(fixImportsInFile);
  fixSpecificIssues();
  
  console.log('🎉 Final fixes complete!');
  console.log('📋 Next steps:');
  console.log('   1. Run: npm run type-check');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the application');
  
} catch (error) {
  console.error('❌ Error during final fixes:', error);
  process.exit(1);
} 