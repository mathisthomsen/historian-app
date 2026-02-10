const fs = require('fs');

console.log('🔧 Adding PersonEventForm to PersonDetailPage...');

const filePath = 'app/persons/[id]/page.tsx';

if (!fs.existsSync(filePath)) {
  console.log(`⚠️  File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Add the PersonEventForm component inside the Drawer
const formComponent = `        <PersonEventForm
          personId={personId}
          personName={\`\${person?.first_name || ''} \${person?.last_name || ''}\`.trim()}
          onResult={(result) => {
            if (result.success) {
              fetchLifeEvents();
              setSnackbarMsg(result.message);
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
              setShowPersonEventForm(false);
              setSelectedId(null);
            } else {
              setSnackbarMsg(result.message);
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
            }
          }}
          onClose={() => {
            setShowPersonEventForm(false);
            setSelectedId(null);
          }}
        />`;

// Replace the empty Drawer content
content = content.replace(
  /      >\s*<\/Drawer>/g,
      `      >
        ${formComponent}
      </Drawer>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added PersonEventForm to PersonDetailPage');
