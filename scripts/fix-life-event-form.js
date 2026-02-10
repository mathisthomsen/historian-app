const fs = require('fs');

console.log('🔧 Fixing LifeEventForm to work with person-event-relations API...');

const filePath = 'app/components/forms/LifeEventForm.tsx';

if (!fs.existsSync(filePath)) {
  console.log(`⚠️  File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Update the LifeEvent interface to match person-event-relations structure
const newLifeEventInterface = `interface LifeEvent {
  id: number;
  relationship_type: string;
  person_id: number;
  event_id: number;
  statement_id?: number;
  person: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
  event: {
    id: number;
    title: string;
    date: string;
    location?: string;
  };
  statement?: {
    id: number;
    content: string;
  };
}`;

// Replace the old LifeEvent interface
content = content.replace(
  /interface LifeEvent \{[^}]*\}/s,
  newLifeEventInterface
);

// Update the form data interface
const newFormDataInterface = `interface LifeEventFormData {
  person_id: number;
  event_id: number;
  relationship_type: string;
  statement_id?: number;
}`;

// Replace the old form data interface
content = content.replace(
  /interface LifeEventFormData \{[^}]*\}/s,
  newFormDataInterface
);

// Update the initial form data
content = content.replace(
  /const \[formData, setFormData\] = useState<LifeEventFormData>\(\{[^}]*\}\);/s,
  `const [formData, setFormData] = useState<LifeEventFormData>({
    person_id: 0,
    event_id: 0,
    relationship_type: 'participant',
    statement_id: undefined
  });`
);

// Update the fetch function to handle the new data structure
const newFetchFunction = `const fetchLifeEvent = async () => {
      if (!lifeEventId) return;
      
      try {
        const res = await fetch(\`/api/person-event-relations/\${lifeEventId}\`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            person_id: data.person_id,
            event_id: data.event_id,
            relationship_type: data.relationship_type,
            statement_id: data.statement_id || undefined
          });
          
          // Set selected values for display
          if (data.person) {
            setSelectedPerson(data.person);
          }
          if (data.event) {
            setSelectedEvent(data.event);
          }
          if (data.statement) {
            setSelectedStatement(data.statement);
          }
        }
      } catch (error) {
        console.error('Error fetching life event:', error);
      }
    };`;

// Replace the fetch function
content = content.replace(
  /const fetchLifeEvent = async \(\) => \{[^}]*\};/s,
  newFetchFunction
);

// Update the submit function
const newSubmitFunction = `const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!selectedProject) {
        setError('Bitte wählen Sie ein Projekt aus');
        return;
      }
      
      setSubmitting(true);
      setError(null);
      
      try {
        const url = mode === 'create' ? '/api/person-event-relations' : \`/api/person-event-relations/\${lifeEventId}\`;
        const method = mode === 'create' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...formData,
            projectId: selectedProject.id,
          }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          const message = mode === 'create' 
            ? 'Beziehung erfolgreich erstellt' 
            : 'Beziehung erfolgreich aktualisiert';
          
          if (onResult) {
            onResult({ success: true, message, lifeEvent: result.relation });
          } else {
            router.push('/persons');
          }
        } else {
          setError(result.error || 'Fehler beim Speichern der Beziehung');
        }
      } catch (err) {
        console.error('Error saving life event:', err);
        setError('Fehler beim Speichern der Beziehung');
      } finally {
        setSubmitting(false);
      }
    };`;

// Replace the submit function
content = content.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{[^}]*\};/s,
  newSubmitFunction
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated LifeEventForm to work with person-event-relations API');
