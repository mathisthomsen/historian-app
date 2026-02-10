const fs = require('fs');

console.log('🔧 Fixing location page to work with person-event-relations API...');

const filePath = 'app/locations/[location]/page.tsx';

if (!fs.existsSync(filePath)) {
  console.log(`⚠️  File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Update the API call to use person-event-relations
content = content.replace(
  /fetch\(`\/api\/person-event-relations\?location=\$\{encodeURIComponent\(decodedLocation\)\}`\)/g,
  `fetch(\`/api/person-event-relations?location=\${encodeURIComponent(decodedLocation)}\`)`
);

// Update any references to life events in the data handling
content = content.replace(
  /lifeEvents/g,
  'relations'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated location page to work with person-event-relations API');
