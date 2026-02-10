const fs = require('fs');

console.log('🔧 Fixing PersonDetailPage to work with person-event-relations API...');

const filePath = 'app/persons/[id]/page.tsx';

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
    birth_date?: string;
    death_date?: string;
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
    confidence: number;
  };
  sourceCount: number;
  hasStatement: boolean;
  hasSources: boolean;
}`;

// Replace the old LifeEvent interface
content = content.replace(
  /interface LifeEvent \{[^}]*\}/s,
  newLifeEventInterface
);

// Update the fetchLifeEvents function to handle the new data structure
const newFetchLifeEvents = `const fetchLifeEvents = useCallback(async () => {
    try {
      const res = await fetch(\`/api/person-event-relations?personId=\${personId}\`);
      if (!res.ok) {
        console.error('Failed to fetch life events');
        setLifeEvents([]);
        return;
      }
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Error parsing life events response:', e);
        data = [];
      }
      
      // Transform person-event-relations to life events format
      const eventsArray = Array.isArray(data) ? data.map(relation => ({
        id: relation.id,
        title: relation.event.title,
        start_date: relation.event.date,
        end_date: relation.event.date, // Use same date for end_date if not available
        location: relation.event.location,
        description: relation.statement?.content || '',
        relationship_type: relation.relationship_type,
        event: relation.event,
        statement: relation.statement,
        sourceCount: relation.sourceCount,
        hasStatement: relation.hasStatement,
        hasSources: relation.hasSources
      })) : [];
      
      setLifeEvents(eventsArray);
    } catch (error) {
      console.error('Error fetching life events:', error);
      setLifeEvents([]);
    }
  }, [personId]);`;

// Replace the fetchLifeEvents function
content = content.replace(
  /const fetchLifeEvents = useCallback\(async \(\) => \{[^}]*\}, \[personId\]\);/s,
  newFetchLifeEvents
);

// Update the delete function to use the correct API
content = content.replace(
  /const res = await fetch\(`\/api\/person-event-relations\/\$\{selectedId\}`, \{ method: 'DELETE' \}\);/,
  `const res = await fetch(\`/api/person-event-relations/\${selectedId}\`, { method: 'DELETE' });`
);

// Update error messages
content = content.replace(
  /'Lebensereignis erfolgreich gelöscht'/g,
  "'Beziehung erfolgreich gelöscht'"
);
content = content.replace(
  /'Fehler beim Löschen des Lebensereignisses'/g,
  "'Fehler beim Löschen der Beziehung'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated PersonDetailPage to work with person-event-relations API');
