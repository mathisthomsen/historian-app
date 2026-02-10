'use client';

import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Stack,
  Container,
  Typography,
  Skeleton,
  Alert,
  Box,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib';

type RelationshipData = {
  id?: number;
  person_id: number;
  event_id: number;
  relationship_type: string;
  statement_id?: number;
};

type Person = {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  death_date?: string;
};

type Event = {
  id: number;
  title: string;
  date?: string;
  location?: string;
};

type Statement = {
  id: number;
  content: string;
  confidence?: number;
  source?: {
    id: number;
    title: string;
    author?: string;
  };
};

type Props = {
  mode: 'create' | 'edit';
  relationshipId?: number;
  onClose?: () => void;
  onResult?: (result: { success: boolean; message: string; relationship?: any }) => void;
};

// Valid relationship types
const RELATIONSHIP_TYPES = [
  { value: 'participant', label: 'Teilnehmer', description: 'Hat an dem Ereignis teilgenommen' },
  { value: 'witness', label: 'Zeuge', description: 'Hat das Ereignis beobachtet' },
  { value: 'affected', label: 'Betroffener', description: 'War von dem Ereignis betroffen' },
  { value: 'organizer', label: 'Organisator', description: 'Hat das Ereignis organisiert' },
  { value: 'leader', label: 'Führer', description: 'Hat das Ereignis angeführt' },
  { value: 'member', label: 'Mitglied', description: 'War Mitglied bei dem Ereignis' },
  { value: 'supporter', label: 'Unterstützer', description: 'Hat das Ereignis unterstützt' },
  { value: 'opponent', label: 'Gegner', description: 'War gegen das Ereignis' },
  { value: 'victim', label: 'Opfer', description: 'War Opfer des Ereignisses' },
  { value: 'perpetrator', label: 'Täter', description: 'War Täter bei dem Ereignis' },
  { value: 'observer', label: 'Beobachter', description: 'Hat das Ereignis beobachtet' },
  { value: 'reporter', label: 'Berichterstatter', description: 'Hat über das Ereignis berichtet' },
  { value: 'beneficiary', label: 'Begünstigter', description: 'Hat von dem Ereignis profitiert' },
  { value: 'contributor', label: 'Beitragender', description: 'Hat zum Ereignis beigetragen' },
  { value: 'influencer', label: 'Einflussnehmer', description: 'Hat das Ereignis beeinflusst' },
  { value: 'follower', label: 'Anhänger', description: 'War Anhänger bei dem Ereignis' },
  { value: 'mentor', label: 'Mentor', description: 'War Mentor bei dem Ereignis' },
  { value: 'student', label: 'Schüler', description: 'War Schüler bei dem Ereignis' },
  { value: 'family_member', label: 'Familienmitglied', description: 'War Familienmitglied' },
  { value: 'colleague', label: 'Kollege', description: 'War Kollege bei dem Ereignis' },
  { value: 'friend', label: 'Freund', description: 'War Freund bei dem Ereignis' },
  { value: 'enemy', label: 'Feind', description: 'War Feind bei dem Ereignis' },
  { value: 'ally', label: 'Verbündeter', description: 'War Verbündeter bei dem Ereignis' },
  { value: 'rival', label: 'Rivale', description: 'War Rivale bei dem Ereignis' },
];

export default function RelationshipForm({ mode, relationshipId, onClose, onResult }: Props) {
  const router = useRouter();
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState<RelationshipData>({
    person_id: 0,
    event_id: 0,
    relationship_type: '',
    statement_id: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Data for dropdowns
  const [persons, setPersons] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  
  // Selected items
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);

  // Load existing relationship if in edit mode
  useEffect(() => {
    if (mode === 'edit' && relationshipId) {
      setInitialLoading(true);
      fetch(`/api/person-event-relations/${relationshipId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setFormData({
              person_id: data.person_id,
              event_id: data.event_id,
              relationship_type: data.relationship_type,
              statement_id: data.statement_id || undefined,
            });
            if (data.person) setSelectedPerson(data.person);
            if (data.event) setSelectedEvent(data.event);
            if (data.statement) setSelectedStatement(data.statement);
          }
        })
        .catch(err => {
          setError('Fehler beim Laden der Beziehung');
          console.error('Error loading relationship:', err);
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [mode, relationshipId]);

  // Load available data
  useEffect(() => {
    if (selectedProject) {
      // Load persons
      fetch(`/api/persons?projectId=${selectedProject.id}&limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.persons) {
            setPersons(data.persons);
          }
        })
        .catch(err => {
          console.error('Error loading persons:', err);
        });

      // Load events
      fetch(`/api/events?projectId=${selectedProject.id}&limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setEvents(data.events);
          }
        })
        .catch(err => {
          console.error('Error loading events:', err);
        });

      // Load statements
      fetch(`/api/statements?projectId=${selectedProject.id}&limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.statements) {
            setStatements(data.statements);
          }
        })
        .catch(err => {
          console.error('Error loading statements:', err);
        });
    }
  }, [selectedProject]);

  const handlePersonChange = (_: any, newValue: Person | null) => {
    setSelectedPerson(newValue);
    setFormData(prev => ({ 
      ...prev, 
      person_id: newValue ? newValue.id : 0 
    }));
  };

  const handleEventChange = (_: any, newValue: Event | null) => {
    setSelectedEvent(newValue);
    setFormData(prev => ({ 
      ...prev, 
      event_id: newValue ? newValue.id : 0 
    }));
  };

  const handleStatementChange = (_: any, newValue: Statement | null) => {
    setSelectedStatement(newValue);
    setFormData(prev => ({ 
      ...prev, 
      statement_id: newValue ? newValue.id : undefined 
    }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.person_id) {
      errors.push('Person ist erforderlich');
    }

    if (!formData.event_id) {
      errors.push('Ereignis ist erforderlich');
    }

    if (!formData.relationship_type) {
      errors.push('Beziehungstyp ist erforderlich');
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (!selectedProject) {
      setError('Bitte wählen Sie ein Projekt aus');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit' ? `/api/person-event-relations/${relationshipId}` : '/api/person-event-relations';
      const method = mode === 'edit' ? 'PUT' : 'POST';

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
          onResult({ success: true, message, relationship: result.relation });
        } else {
          router.push('/relationships');
        }
      } else {
        setError(result.error || 'Fehler beim Speichern der Beziehung');
      }
    } catch (err) {
      console.error('Error saving relationship:', err);
      setError('Fehler beim Speichern der Beziehung');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {mode === 'create' ? 'Neue Beziehung erstellen' : 'Beziehung bearbeiten'}
      </Typography>

      {!selectedProject && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Bitte wählen Sie ein Projekt aus, um eine Beziehung zu erstellen.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Stack spacing={3}>
          {/* Person Selection */}
          <Autocomplete
            options={persons}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
            value={selectedPerson}
            onChange={handlePersonChange}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Person"
                helperText="Wählen Sie eine Person"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack>
                  <Typography variant="body1">
                    {option.first_name} {option.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.birth_date && `Geboren: ${new Date(option.birth_date).getFullYear()}`}
                    {option.death_date && ` • Gestorben: ${new Date(option.death_date).getFullYear()}`}
                  </Typography>
                </Stack>
              </Box>
            )}
          />

          {/* Event Selection */}
          <Autocomplete
            options={events}
            getOptionLabel={(option) => option.title}
            value={selectedEvent}
            onChange={handleEventChange}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Ereignis"
                helperText="Wählen Sie ein Ereignis"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack>
                  <Typography variant="body1">{option.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.date && `${new Date(option.date).getFullYear()}`}
                    {option.location && ` • ${option.location}`}
                  </Typography>
                </Stack>
              </Box>
            )}
          />

          {/* Relationship Type */}
          <FormControl fullWidth required>
            <InputLabel>Beziehungstyp</InputLabel>
            <Select
              value={formData.relationship_type}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship_type: e.target.value }))}
              label="Beziehungstyp"
            >
              {RELATIONSHIP_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Stack>
                    <Typography variant="body1">{type.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Art der Beziehung zwischen Person und Ereignis
            </FormHelperText>
          </FormControl>

          {/* Statement Selection */}
          <Autocomplete
            options={statements}
            getOptionLabel={(option) => option.content.substring(0, 50) + '...'}
            value={selectedStatement}
            onChange={handleStatementChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Aussage (optional)"
                helperText="Wählen Sie eine Aussage für diese Beziehung"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack>
                  <Typography variant="body1">
                    {option.content.substring(0, 100)}...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.confidence && `Vertrauen: ${Math.round(option.confidence * 100)}%`}
                    {option.source && ` • Quelle: ${option.source.title}`}
                  </Typography>
                </Stack>
              </Box>
            )}
          />

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onClose && (
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={submitting}
              >
                Abbrechen
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !selectedProject}
            >
              {submitting ? 'Speichern...' : (mode === 'create' ? 'Erstellen' : 'Aktualisieren')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
} 