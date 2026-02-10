const fs = require('fs');

console.log('🔧 Updating PersonDetailPage to use new PersonEventForm...');

const filePath = 'app/persons/[id]/page.tsx';

if (!fs.existsSync(filePath)) {
  console.log(`⚠️  File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Replace the LifeEventForm import with PersonEventForm
content = content.replace(
  /import LifeEventForm from '\.\.\/\.\.\/components\/forms\/LifeEventForm';/g,
  "import PersonEventForm from '../../components/forms/PersonEventForm';"
);

// Update the form component usage
content = content.replace(
  /<LifeEventForm/g,
  '<PersonEventForm'
);

// Update the form props - fix the personName prop
content = content.replace(
  /personId=\{personId\}/g,
  'personName={`${person?.first_name || ""} ${person?.last_name || ""}`.trim()}'
);

// Update the form result handling
content = content.replace(
  /onResult=\{\(result\) => \{\s*if \(result\.success\) \{\s*fetchLifeEvents\(\);\s*setSnackbarMsg\(result\.message\);\s*setSnackbarSeverity\('success'\);\s*setSnackbarOpen\(true\);\s*setShowLifeEventForm\(false\);\s*setSelectedId\(null\);\s*\}\s*else \{\s*setSnackbarMsg\(result\.message\);\s*setSnackbarSeverity\('error'\);\s*setSnackbarOpen\(true\);\s*\}\s*\}\}/g,
  `onResult={(result) => {
        if (result.success) {
          fetchLifeEvents();
          setSnackbarMsg(result.message);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          setShowLifeEventForm(false);
          setSelectedId(null);
        } else {
          setSnackbarMsg(result.message);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }}`
);

// Update the form close handling
content = content.replace(
  /onClose=\{\(\) => \{\s*setShowLifeEventForm\(false\);\s*setSelectedId\(null\);\s*\}\}/g,
  `onClose={() => {
        setShowLifeEventForm(false);
        setSelectedId(null);
      }}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated PersonDetailPage to use new PersonEventForm');
