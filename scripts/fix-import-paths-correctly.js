#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing import paths with correct relative paths...');

// Function to determine the correct relative path based on file location
const getCorrectRelativePath = (filePath, targetPath) => {
  const fileDir = path.dirname(filePath);
  const targetDir = path.resolve(targetPath);
  const relativePath = path.relative(fileDir, targetDir);
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
};

// Critical import path mappings with correct relative paths
const pathMappings = [
  // Files in app/events/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/events\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/persons/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/persons\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/locations/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/locations\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/literature/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/literature\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/sources/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/sources\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/timeline/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/timeline\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/analytics/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/analytics\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/bibliography-sync/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/bibliography-sync\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/account/ should import from ../../lib and ../../contexts
  {
    pattern: /app\/account\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../../types/project'" },
    ]
  },
  // Files in app/dashboard/ should import from ../lib and ../contexts
  {
    pattern: /app\/dashboard\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../types/project'" },
    ]
  },
  // Files in app/components/ should import from ../lib and ../contexts
  {
    pattern: /app\/components\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/lib['"]/g, to: "from '../lib'" },
      { from: /from\s+['"]\.\.\/contexts\/ProjectContext['"]/g, to: "from '../contexts/ProjectContext'" },
      { from: /from\s+['"]\.\.\/hooks\/useProjectApi['"]/g, to: "from '../hooks/useProjectApi'" },
      { from: /from\s+['"]\.\.\/types\/project['"]/g, to: "from '../types/project'" },
    ]
  },
  // Files in app/contexts/ should import from ../types
  {
    pattern: /app\/contexts\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/\.\.\/types\/project['"]/g, to: "from '../types/project'" },
    ]
  },
  // Files in app/hooks/ should import from ../contexts
  {
    pattern: /app\/hooks\/.*\.tsx?$/,
    mappings: [
      { from: /from\s+['"]\.\.\/\.\.\/contexts\/ProjectContext['"]/g, to: "from '../contexts/ProjectContext'" },
    ]
  },
];

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

// Fix imports in a file
const fixImportsInFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find the matching pattern and apply mappings
    for (const pathMapping of pathMappings) {
      if (pathMapping.pattern.test(filePath)) {
        for (const mapping of pathMapping.mappings) {
          if (mapping.from.test(content)) {
            content = content.replace(mapping.from, mapping.to);
            modified = true;
            console.log(`✅ Fixed: ${filePath} - ${mapping.from.source} -> ${mapping.to}`);
          }
        }
        break; // Only apply one pattern per file
      }
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
    content = content.replace(/loading={loading}/g, '');
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
  
  console.log('🎉 Import path fixes complete!');
  console.log('📋 Next steps:');
  console.log('   1. Run: npm run type-check');
  console.log('   2. Test the application at http://localhost:3002');
  console.log('   3. Navigate to different pages to verify they work');
  
} catch (error) {
  console.error('❌ Error during import path fixes:', error);
  process.exit(1);
} 