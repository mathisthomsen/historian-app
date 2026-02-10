const fs = require('fs');

console.log('�� Updating PersonDetailPage state variables...');

const filePath = 'app/persons/[id]/page.tsx';

if (!fs.existsSync(filePath)) {
  console.log(`⚠️  File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Update state variable names
content = content.replace(
  /const \[showLifeEventForm, setShowLifeEventForm\] = useState\(false\);/g,
  'const [showPersonEventForm, setShowPersonEventForm] = useState(false);'
);

// Update all setShowLifeEventForm calls
content = content.replace(
  /setShowLifeEventForm\(true\)/g,
  'setShowPersonEventForm(true)'
);

content = content.replace(
  /setShowLifeEventForm\(false\)/g,
  'setShowPersonEventForm(false)'
);

// Update the Dialog open prop
content = content.replace(
  /open=\{showLifeEventForm\}/g,
  'open={showPersonEventForm}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated PersonDetailPage state variables');
