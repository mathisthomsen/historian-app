const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing life-events API references...');

// Files that need to be updated
const filesToUpdate = [
  'app/persons/[id]/page.tsx',
  'app/locations/[location]/page.tsx',
  'app/components/forms/LifeEventForm.tsx'
];

// Function to update a file
function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Replace life-events API calls with person-event-relations
  const replacements = [
    // PersonDetailPage fetchLifeEvents function
    {
      from: /const fetchLifeEvents = useCallback\(async \(\) => \{\s*try \{\s*const res = await fetch\(`\/api\/life-events\?personId=\$\{personId\}`\);/g,
      to: `const fetchLifeEvents = useCallback(async () => {
    try {
      const res = await fetch(\`/api/person-event-relations?personId=\${personId}\`);`
    },
    {
      from: /const res = await fetch\(`\/api\/life-events\?personId=\$\{personId\}`\);/g,
      to: `const res = await fetch(\`/api/person-event-relations?personId=\${personId}\`);`
    },
    // Delete life event
    {
      from: /const res = await fetch\(`\/api\/life-events\/\$\{selectedId\}`, \{ method: 'DELETE' \}\);/g,
      to: `const res = await fetch(\`/api/person-event-relations/\${selectedId}\`, { method: 'DELETE' });`
    },
    // LifeEventForm API calls
    {
      from: /fetch\(`\/api\/life-events\/\$\{lifeEventId\}`\)/g,
      to: `fetch(\`/api/person-event-relations/\${lifeEventId}\`)`
    },
    {
      from: /const url = mode === 'create' \? '\/api\/life-events' : `\/api\/life-events\/\$\{lifeEventId\}`;/g,
      to: `const url = mode === 'create' ? '/api/person-event-relations' : \`/api/person-event-relations/\${lifeEventId}\`;`
    },
    // Location page
    {
      from: /fetch\(`\/api\/life-events\?location=\$\{encodeURIComponent\(decodedLocation\)\}`\)/g,
      to: `fetch(\`/api/person-event-relations?location=\${encodeURIComponent(decodedLocation)}\`)`
    }
  ];

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

// Update all files
filesToUpdate.forEach(updateFile);

console.log('🎉 Life-events API fix complete!');
