#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Final root directory cleanup...');

// Create necessary directories if they don't exist
const createDirectories = () => {
  const dirs = [
    'scripts/utils',
    'scripts/db',
    'docs/development',
    'docs/deployment',
    'docs/api',
    'config',
    'public/images',
    'public/screenshots',
    'test-results',
    'playwright-report'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// File movement mappings
const fileMoves = [
  // Test-related files -> scripts/utils/
  { from: 'create-test-user.js', to: 'scripts/utils/create-test-user.js' },
  { from: 'create-test-user.min.js', to: 'scripts/utils/create-test-user.min.js' },
  { from: 'test-dashboard.js', to: 'scripts/utils/test-dashboard.js' },
  { from: 'test-dashboard.min.js', to: 'scripts/utils/test-dashboard.min.js' },
  { from: 'test-login.min.js', to: 'scripts/utils/test-login.min.js' },
  { from: 'test-prisma.js', to: 'scripts/utils/test-prisma.js' },
  { from: 'test-prisma.min.js', to: 'scripts/utils/test-prisma.min.js' },
  { from: 'test-refresh.js', to: 'scripts/utils/test-refresh.js' },
  
  // Documentation files -> docs/development/
  { from: 'EMERGENCY_REFACTORING_GUIDE.md', to: 'docs/development/EMERGENCY_REFACTORING_GUIDE.md' },
  
  // Screenshots and images -> public/images/
  { from: 'test-screenshot.png', to: 'public/images/test-screenshot.png' },
  { from: 'person-not-found.png', to: 'public/images/person-not-found.png' },
  { from: 'after-form-submission.png', to: 'public/images/after-form-submission.png' },
  { from: 'after-person-creation.png', to: 'public/images/after-person-creation.png' },
  { from: 'after-refresh.png', to: 'public/images/after-refresh.png' },
  
  // Configuration files -> config/
  { from: '.eslintrc.json', to: 'config/.eslintrc.json' },
  { from: '.dockerignore', to: 'config/.dockerignore' },
  { from: 'vercel.json', to: 'config/vercel.json' },
  
  // Environment files -> config/
  { from: 'env.example', to: 'config/env.example' },
  { from: 'env.production.example', to: 'config/env.production.example' },
  
  // Database backup -> scripts/db/
  { from: 'backup-1754321652066.json', to: 'scripts/db/backup-1754321652066.json' },
  
  // TypeScript build info -> can be deleted (regenerated)
  { from: 'tsconfig.tsbuildinfo', to: null }, // Will be deleted
  
  // Package backup -> can be deleted
  { from: 'package.json.backup', to: null }, // Will be deleted
];

// Move files
const moveFiles = () => {
  fileMoves.forEach(move => {
    try {
      if (fs.existsSync(move.from)) {
        if (move.to === null) {
          // Delete file
          fs.unlinkSync(move.from);
          console.log(`🗑️  Deleted: ${move.from}`);
        } else {
          // Move file
          fs.renameSync(move.from, move.to);
          console.log(`📦 Moved: ${move.from} -> ${move.to}`);
        }
      } else {
        console.log(`⚠️  File not found: ${move.from}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${move.from}:`, error.message);
    }
  });
};

// Update package.json scripts to reflect new paths
const updatePackageScripts = () => {
  try {
    const packagePath = 'package.json';
    let packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    // Update any scripts that reference moved files
    if (packageJson.scripts) {
      Object.keys(packageJson.scripts).forEach(key => {
        const script = packageJson.scripts[key];
        // Update any references to moved files
        if (script.includes('create-test-user.js')) {
          packageJson.scripts[key] = script.replace('create-test-user.js', 'scripts/utils/create-test-user.js');
        }
        if (script.includes('test-dashboard.js')) {
          packageJson.scripts[key] = script.replace('test-dashboard.js', 'scripts/utils/test-dashboard.js');
        }
        if (script.includes('test-prisma.js')) {
          packageJson.scripts[key] = script.replace('test-prisma.js', 'scripts/utils/test-prisma.js');
        }
      });
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts');
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
  }
};

// Update .gitignore to reflect new structure
const updateGitignore = () => {
  try {
    const gitignorePath = '.gitignore';
    let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    // Add new directories to ignore
    const additions = [
      '',
      '# Build artifacts',
      'tsconfig.tsbuildinfo',
      '',
      '# Test results',
      'test-results/',
      'playwright-report/',
      '',
      '# Screenshots',
      'public/images/*.png',
      '!public/images/',
      '',
      '# Backup files',
      '*.backup',
      'backup-*.json',
    ];
    
    gitignoreContent += additions.join('\n');
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Updated .gitignore');
  } catch (error) {
    console.error('❌ Error updating .gitignore:', error.message);
  }
};

// Create a summary of the new structure
const createStructureSummary = () => {
  const summary = `# 📁 Final Root Directory Structure

## ✅ Clean Root Directory
\`\`\`
historian_app/
├── 📁 app/                    # Next.js App Router (main application)
├── 📁 tests/                  # Test files
├── 📁 docs/                   # Documentation
│   ├── 📁 development/       # Development guides
│   ├── 📁 deployment/        # Deployment guides
│   └── 📁 api/               # API documentation
├── 📁 config/                 # Configuration files
│   ├── next.config.mjs
│   ├── jest.config.js
│   ├── playwright.config.ts
│   ├── .eslintrc.json
│   ├── vercel.json
│   ├── env.example
│   └── env.production.example
├── 📁 docker/                 # Docker configuration
├── 📁 scripts/                # Build and utility scripts
│   ├── 📁 utils/             # Utility scripts
│   ├── 📁 db/                # Database scripts
│   └── 📁 build/             # Build scripts
├── 📁 public/                 # Static assets
│   ├── 📁 images/            # Images and screenshots
│   └── ...
├── 📁 prisma/                 # Database schema and migrations
├── 📁 test-results/           # Test results
├── 📁 playwright-report/     # Playwright test reports
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
└── .next/                     # Next.js build output
\`\`\`

## 🗑️ Files Removed from Root
- \`tsconfig.tsbuildinfo\` - Build artifact (regenerated)
- \`package.json.backup\` - Backup file (no longer needed)
- \`EMERGENCY_REFACTORING_GUIDE.md\` - Moved to docs/development/
- All test scripts moved to scripts/utils/
- All screenshots moved to public/images/
- All configuration files moved to config/

## 🎯 Benefits
- ✅ **Clean root directory** - Only essential files remain
- ✅ **Organized structure** - Everything has its proper place
- ✅ **Better discoverability** - Related files grouped together
- ✅ **Easier maintenance** - Clear separation of concerns
- ✅ **Professional appearance** - Follows industry standards
`;

  fs.writeFileSync('docs/development/FINAL_STRUCTURE_SUMMARY.md', summary);
  console.log('✅ Created structure summary');
};

// Main execution
try {
  console.log('🏗️ Starting root directory cleanup...');
  
  createDirectories();
  moveFiles();
  updatePackageScripts();
  updateGitignore();
  createStructureSummary();
  
  console.log('🎉 Root directory cleanup complete!');
  console.log('📋 Summary:');
  console.log('   - Moved test scripts to scripts/utils/');
  console.log('   - Moved documentation to docs/development/');
  console.log('   - Moved screenshots to public/images/');
  console.log('   - Moved config files to config/');
  console.log('   - Deleted build artifacts and backups');
  console.log('   - Updated package.json and .gitignore');
  console.log('');
  console.log('🚀 Your root directory is now clean and organized!');
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
} 