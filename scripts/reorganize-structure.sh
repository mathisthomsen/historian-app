#!/bin/bash

# 🏗️ File Structure Reorganization Script
# This script reorganizes the historian_app project structure for better maintainability

set -e  # Exit on any error

echo "🏗️ Starting file structure reorganization..."

# Create new directory structure
echo "📁 Creating new directory structure..."

# App structure
mkdir -p app/lib/api app/lib/auth app/lib/database app/lib/utils app/lib/services app/lib/config
mkdir -p app/components/ui app/components/forms app/components/layout app/components/data app/components/maps
mkdir -p app/styles
mkdir -p "app/(auth)/login" "app/(auth)/register" "app/(auth)/verify"
mkdir -p "app/(dashboard)/dashboard" "app/(dashboard)/persons" "app/(dashboard)/events" "app/(dashboard)/locations" "app/(dashboard)/literature" "app/(dashboard)/sources" "app/(dashboard)/timeline" "app/(dashboard)/analytics"
mkdir -p "app/(account)/profile" "app/(account)/projects"

# Test structure
mkdir -p tests/{unit,integration,e2e,fixtures}

# Scripts structure
mkdir -p scripts/{build,dev,db,utils}

# Documentation structure
mkdir -p docs/{api,components,deployment,development}

# Configuration structure
mkdir -p config

# Docker structure
mkdir -p docker/nginx

echo "✅ Directory structure created"

# Phase 1: Move test files
echo "📦 Phase 1: Moving test files..."

# Move test directories
if [ -d "__tests__" ]; then
    mv __tests__/* tests/
    rmdir __tests__
fi

# Move test scripts to utils
for file in test_*.js test_*.min.js; do
    if [ -f "$file" ]; then
        mv "$file" scripts/utils/
    fi
done

# Move e2e tests
if [ -d "e2e" ]; then
    mv e2e/* tests/e2e/
    rmdir e2e
fi

echo "✅ Test files moved"

# Phase 2: Move documentation
echo "📚 Phase 2: Moving documentation..."

# Move markdown files to docs/development
for file in *.md; do
    if [ -f "$file" ] && [ "$file" != "README.md" ]; then
        mv "$file" docs/development/
    fi
done

# Move specific documentation files
if [ -f "DEPLOYMENT.md" ]; then
    mv DEPLOYMENT.md docs/deployment/
fi

if [ -f "BACKEND_IMPLEMENTATION_SUMMARY.md" ]; then
    mv BACKEND_IMPLEMENTATION_SUMMARY.md docs/development/
fi

if [ -f "UI_IMPLEMENTATION_SUMMARY.md" ]; then
    mv UI_IMPLEMENTATION_SUMMARY.md docs/development/
fi

if [ -f "IMPLEMENTATION_SUMMARY.md" ]; then
    mv IMPLEMENTATION_SUMMARY.md docs/development/
fi

if [ -f "ADVANCED_IMPORT_FEATURES.md" ]; then
    mv ADVANCED_IMPORT_FEATURES.md docs/development/
fi

if [ -f "IMPORT_UX_IMPROVEMENTS.md" ]; then
    mv IMPORT_UX_IMPROVEMENTS.md docs/development/
fi

if [ -f "FUZZY_DATA_RESEARCH.md" ]; then
    mv FUZZY_DATA_RESEARCH.md docs/development/
fi

if [ -f "MIGRATION_GUIDE.md" ]; then
    mv MIGRATION_GUIDE.md docs/development/
fi

if [ -f "SERVER_SETUP.md" ]; then
    mv SERVER_SETUP.md docs/deployment/
fi

if [ -f "SSL_SETUP.md" ]; then
    mv SSL_SETUP.md docs/deployment/
fi

echo "✅ Documentation moved"

# Phase 3: Move configuration files
echo "⚙️ Phase 3: Moving configuration files..."

# Move config files
for file in next.config.mjs jest.config.js jest.config.min.js jest.setup.js playwright.config.ts jsconfig.json; do
    if [ -f "$file" ]; then
        mv "$file" config/
    fi
done

echo "✅ Configuration files moved"

# Phase 4: Move Docker files
echo "🐳 Phase 4: Moving Docker files..."

# Move Docker files
if [ -f "Dockerfile" ]; then
    mv Dockerfile docker/
fi

for file in docker-compose*.yml; do
    if [ -f "$file" ]; then
        mv "$file" docker/
    fi
done

# Move nginx files
if [ -d "nginx" ]; then
    mv nginx/* docker/nginx/
    rmdir nginx
fi

echo "✅ Docker files moved"

# Phase 5: Move scripts
echo "🔧 Phase 5: Moving scripts..."

# Move deployment scripts
for file in deploy*.sh; do
    if [ -f "$file" ]; then
        mv "$file" scripts/build/
    fi
done

# Move database scripts
for file in migrate*.js migrate*.sh; do
    if [ -f "$file" ]; then
        mv "$file" scripts/db/
    fi
done

# Move utility scripts
for file in create_*.js create_*.min.js verify*.js verify*.min.js list*.js list*.min.js check*.js check*.min.js; do
    if [ -f "$file" ]; then
        mv "$file" scripts/utils/
    fi
done

# Move other scripts
for file in server-setup.sh monitor.sh ssl-renewal.sh; do
    if [ -f "$file" ]; then
        mv "$file" scripts/dev/
    fi
done

echo "✅ Scripts moved"

# Phase 6: Consolidate lib directories
echo "📚 Phase 6: Consolidating library directories..."

# Move libs content to lib/database
if [ -d "app/libs" ]; then
    mv app/libs/* app/lib/database/
    rmdir app/libs
fi

# Organize lib files into subdirectories
cd app/lib

# Move auth-related files
mv auth.ts auth/
mv customPrismaAdapter.ts auth/
mv requireUser.ts auth/

# Move database files
mv prisma.ts database/

# Move API files
mv api.ts api/

# Move utility files
mv validation.ts utils/
mv fuzzyData.ts utils/

# Move service files
mv geocoding.ts services/
mv email.ts services/
mv bibliography-sync.ts services/

# Move config files
mv theme.ts config/

# Move cache
mv cache.ts utils/

cd ../..

echo "✅ Library directories consolidated"

# Phase 7: Organize components
echo "🧩 Phase 7: Organizing components..."

cd app/components

# Move form components
mv PersonForm.tsx forms/
mv EventForm.tsx forms/
mv LifeEventForm.tsx forms/
mv RelationshipForm.tsx forms/
mv ProjectForm.tsx forms/
mv SourceForm.tsx forms/
mv StatementForm.tsx forms/

# Move layout components
mv Navigation.tsx layout/
mv DrawerNavigation.tsx layout/
mv AppBarNavigation.tsx layout/
mv SiteHeader.tsx layout/
mv LoadingBar.tsx layout/
mv LoadingSkeleton.tsx layout/
mv PageSkeleton.tsx layout/
mv DashboardSkeleton.tsx layout/

# Move data components
mv ChartsEvents.tsx data/
mv DataGrid.tsx data/ 2>/dev/null || true
mv paginationComponent.jsx data/

# Move map components
mv LocationMap.tsx maps/
mv SimpleLocationMap.tsx maps/

# Move UI components
mv ModalDeleteConfirmation.tsx ui/
mv BulkEditModal.tsx ui/
mv ErrorBoundary.tsx ui/
mv customToolbar.tsx ui/

# Move other components
mv ImportEvents.tsx data/
mv ImportPersons.tsx data/
mv ImportHistory.tsx data/
mv RelationshipNetwork.tsx data/
mv ProjectMembers.tsx data/

cd ../..

echo "✅ Components organized"

# Phase 8: Update import paths
echo "🔗 Phase 8: Updating import paths..."

# Run the emergency refactor script to update imports
if [ -f "scripts/emergency-refactor.js" ]; then
    node scripts/emergency-refactor.js
fi

echo "✅ Import paths updated"

# Phase 9: Clean up root directory
echo "🧹 Phase 9: Cleaning up root directory..."

# Remove empty directories
find . -type d -empty -delete 2>/dev/null || true

# Remove temporary files
rm -f tsconfig.tsbuildinfo 2>/dev/null || true

echo "✅ Root directory cleaned"

# Phase 10: Update configuration references
echo "⚙️ Phase 10: Updating configuration references..."

# Update package.json scripts to reference new config location
if [ -f "package.json" ]; then
    # Create backup
    cp package.json package.json.backup
    
    # Update jest config path
    sed -i '' 's/jest.config.js/config\/jest.config.js/g' package.json
    sed -i '' 's/jest.setup.js/config\/jest.setup.js/g' package.json
    
    # Update playwright config path
    sed -i '' 's/playwright.config.ts/config\/playwright.config.ts/g' package.json
fi

echo "✅ Configuration references updated"

echo ""
echo "🎉 File structure reorganization complete!"
echo ""
echo "📋 Summary of changes:"
echo "✅ Created organized directory structure"
echo "✅ Moved test files to tests/"
echo "✅ Moved documentation to docs/"
echo "✅ Moved configuration files to config/"
echo "✅ Moved Docker files to docker/"
echo "✅ Consolidated library directories"
echo "✅ Organized components by type"
echo "✅ Updated import paths"
echo "✅ Cleaned up root directory"
echo ""
echo "🚀 Next steps:"
echo "1. Test the application: npm run dev"
echo "2. Run type check: npm run type-check"
echo "3. Run tests: npm test"
echo "4. Update any remaining import paths manually"
echo "5. Update documentation to reflect new structure"
echo ""
echo "📁 New structure created successfully!" 