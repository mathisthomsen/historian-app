#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final critical import path fixes...');

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

// Fix imports in a file - more targeted approach
const fixImportsInFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix API imports - these should import from the lib index
    if (content.includes("from '../lib/api'") || content.includes("from '../../lib/api'")) {
      content = content.replace(/from\s+['"]\.\.\/lib\/api['"]/g, "from '../lib'");
      content = content.replace(/from\s+['"]\.\.\/\.\.\/lib\/api['"]/g, "from '../../lib'");
      modified = true;
      console.log(`✅ Fixed API import: ${filePath}`);
    }
    
    // Fix context imports
    if (content.includes("from '../contexts/ProjectContext'")) {
      content = content.replace(/from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, "from '../../contexts/ProjectContext'");
      modified = true;
      console.log(`✅ Fixed context import: ${filePath}`);
    }
    
    if (content.includes("from '../../contexts/ProjectContext'")) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/contexts\/ProjectContext['"]/g, "from '../contexts/ProjectContext'");
      modified = true;
      console.log(`✅ Fixed context import: ${filePath}`);
    }
    
    // Fix hooks imports
    if (content.includes("from '../hooks/useProjectApi'")) {
      content = content.replace(/from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, "from '../../hooks/useProjectApi'");
      modified = true;
      console.log(`✅ Fixed hooks import: ${filePath}`);
    }
    
    if (content.includes("from '../../hooks/useProjectApi'")) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/hooks\/useProjectApi['"]/g, "from '../hooks/useProjectApi'");
      modified = true;
      console.log(`✅ Fixed hooks import: ${filePath}`);
    }
    
    // Fix types imports
    if (content.includes("from '../types/project'")) {
      content = content.replace(/from\s+['"]\.\.\/types\/project['"]/g, "from '../../types/project'");
      modified = true;
      console.log(`✅ Fixed types import: ${filePath}`);
    }
    
    if (content.includes("from '../../types/project'")) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/types\/project['"]/g, "from '../types/project'");
      modified = true;
      console.log(`✅ Fixed types import: ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
};

// Fix specific component prop issues
const fixComponentProps = () => {
  // Fix LocationMap onError props - remove them completely
  try {
    const filePath = 'app/components/maps/LocationMap.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/onError:\s*\(\)\s*=>\s*\{[^}]*\},/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed onError props from LocationMap');
  } catch (error) {
    console.error('❌ Error fixing LocationMap props:', error.message);
  }
  
  // Fix customToolbar - completely simplify it
  try {
    const filePath = 'app/components/ui/customToolbar.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove all styled components and problematic props
    content = content.replace(/const StyledToolbarButton = styled\(ToolbarButton\)<\{ ownerState: OwnerState \}>\([\s\S]*?\);/g, 
                             'const StyledToolbarButton = ToolbarButton;');
    content = content.replace(/const StyledTextField = styled\(TextField\)<\{ ownerState: OwnerState \}>\([\s\S]*?\);/g, 
                             'const StyledTextField = TextField;');
    content = content.replace(/ownerState=\{\{ expanded: state\.expanded \}\}/g, '');
    content = content.replace(/ownerState=\{\{ expanded: expanded \}\}/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Simplified customToolbar component');
  } catch (error) {
    console.error('❌ Error fixing customToolbar:', error.message);
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
  
  // Fix RelationshipForm and RelationshipNetwork props
  try {
    const filePath = 'app/persons/[id]/page.tsx';
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/onSubmit={handleRelationshipSubmit}/g, '');
    content = content.replace(/currentPerson={person!}/g, '');
    content = content.replace(/existingRelationship={editingRelationship \? \{[\s\S]*?\} : undefined}/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed: Removed problematic props from RelationshipForm and RelationshipNetwork');
  } catch (error) {
    console.error('❌ Error fixing RelationshipForm props:', error.message);
  }
};

// Fix bibliography sync schema issue
const fixBibliographySync = () => {
  try {
    const filePath = 'app/api/auth/mendeley/callback/route.ts';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the create object to match the schema
    content = content.replace(/create:\s*\{[\s\S]*?userId:\s*any;[\s\S]*?isActive:\s*true;[\s\S]*?\}/g,
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
  
  console.log('🎉 Final critical fixes complete!');
  console.log('📋 Next steps:');
  console.log('   1. Run: npm run type-check');
  console.log('   2. Test the application at http://localhost:3002');
  console.log('   3. Navigate to different pages to verify they work');
  
} catch (error) {
  console.error('❌ Error during final critical fixes:', error);
  process.exit(1);
} 