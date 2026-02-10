#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final comprehensive import path fixes...');

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

// Comprehensive import path mappings
const comprehensiveMappings = [
  // RequireAuth component imports
  { from: '../../components/RequireAuth', to: '../../components/layout/RequireAuth' },
  { from: '../components/RequireAuth', to: '../components/layout/RequireAuth' },
  { from: './components/RequireAuth', to: './components/layout/RequireAuth' },
  
  // navConfig imports
  { from: './components/navConfig', to: './components/layout/navConfig' },
  { from: '../navConfig', to: '../layout/navConfig' },
  { from: '../../navConfig', to: '../../layout/navConfig' },
  
  // API imports - fix the double /api/api issue
  { from: '../lib/api/api', to: '../lib/api' },
  { from: '../../lib/api/api', to: '../../lib/api' },
  { from: '../../../lib/api/api', to: '../../../lib/api' },
  
  // Context and hooks imports
  { from: '../contexts/ProjectContext', to: '../../contexts/ProjectContext' },
  { from: '../../contexts/ProjectContext', to: '../contexts/ProjectContext' },
  { from: '../hooks/useProjectApi', to: '../../hooks/useProjectApi' },
  { from: '../../hooks/useProjectApi', to: '../hooks/useProjectApi' },
  { from: '../types/project', to: '../../types/project' },
  { from: '../../types/project', to: '../types/project' },
  
  // Fuzzy data imports
  { from: '../lib/utils/fuzzyData', to: '../lib/utils/fuzzyData' },
  { from: '../../lib/utils/fuzzyData', to: '../../lib/utils/fuzzyData' },
  { from: '../../../lib/utils/fuzzyData', to: '../../../lib/utils/fuzzyData' },
  
  // Geocoding imports
  { from: '../lib/services/geocoding', to: '../lib/services/geocoding' },
  { from: '../../lib/services/geocoding', to: '../../lib/services/geocoding' },
  { from: '../../../lib/services/geocoding', to: '../../../lib/services/geocoding' },
  
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
    
    comprehensiveMappings.forEach(mapping => {
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

// Fix specific component prop issues
const fixComponentProps = () => {
  // Fix DrawerNavigation id prop issue
  try {
    const filePath = 'app/client-layout.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<DrawerNavigation id="public-navigation-drawer-content" items={mainNavLoggedOut} \/>/g, 
                             '<DrawerNavigation items={mainNavLoggedOut} />');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed id prop from DrawerNavigation');
  } catch (error) {
    console.error('❌ Error fixing DrawerNavigation props:', error.message);
  }
  
  // Fix RelationshipForm open prop issue
  try {
    const filePath = 'app/persons/[id]/page.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/open={showRelationshipForm}/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed open prop from RelationshipForm');
  } catch (error) {
    console.error('❌ Error fixing RelationshipForm props:', error.message);
  }
  
  // Fix Grid component prop issue
  try {
    const filePath = 'app/locations/manage/page.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<Grid item xs={12} sm={6} md={4} key={location\.id}>/g, 
                             '<Grid component="div" item xs={12} sm={6} md={4} key={location.id}>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Added component prop to Grid');
  } catch (error) {
    console.error('❌ Error fixing Grid props:', error.message);
  }
};

// Fix bibliography sync schema issue
const fixBibliographySync = () => {
  try {
    const filePath = 'app/api/auth/mendeley/callback/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the create object to match the schema
    content = content.replace(/create:\s*{\s*userId:\s*any;\s*service:\s*string;\s*name:\s*string;\s*accessToken:\s*any;\s*refreshToken:\s*any;\s*tokenExpiresAt:\s*Date\s*\|\s*null;\s*isActive:\s*true;\s*}/g,
                             `create: {
        userId: user.id,
        service: 'mendeley',
        name: 'Mendeley',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : null,
        isActive: true,
        updatedAt: new Date(),
        users: {
          connect: { id: user.id }
        }
      }`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: bibliography sync schema in mendeley callback');
  } catch (error) {
    console.error('❌ Error fixing bibliography sync:', error.message);
  }
};

// Main execution
try {
  const files = findFiles('./app');
  console.log(`📁 Found ${files.length} files to process...`);
  
  files.forEach(fixImportsInFile);
  fixComponentProps();
  fixBibliographySync();
  
  console.log('🎉 Comprehensive fixes complete!');
  console.log('📋 Next steps:');
  console.log('   1. Run: npm run type-check');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the application');
  
} catch (error) {
  console.error('❌ Error during comprehensive fixes:', error);
  process.exit(1);
} 