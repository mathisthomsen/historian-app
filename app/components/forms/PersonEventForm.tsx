'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useProject } from '../../contexts/ProjectContext';
import LocationGeocodingField from './LocationGeocodingField';

interface Event {
  id: number;
  title: string;
  date: string;
  location?: string;
}

interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
}

interface Statement {
  id: number;
  content: string;
}

interface PersonEventFormData {
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  eventLocation?: string;
  eventDescription?: string;
  relationshipType: string;
  statementId?: number;
}

interface PersonEventFormProps {
  personId: number;
  personName?: string;
  onResult?: (result: { success: boolean; message: string; event?: any; relation?: any }) => void;
  onClose?: () => void;
}

const VALID_RELATIONSHIP_TYPES = [
  'participant', 'witness', 'affected', 'organizer', 'leader', 'member',
  'supporter', 'opponent', 'victim', 'perpetrator', 'observer', 'reporter',
  'beneficiary', 'contributor', 'influencer', 'follower', 'mentor', 'student',
  'family_member', 'colleague', 'friend', 'enemy', 'ally', 'rival'
];

export default function PersonEventForm({ personId, personName, onResult, onClose }: PersonEventFormProps) {
  const [formData, setFormData] = useState<PersonEventFormData>({
    eventTitle: '',
    eventDate: '',
    eventEndDate: '',
    eventLocation: '',
    eventDescription: '',
    relationshipType: 'participant',
    statementId: undefined
  });
  
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { selectedProject } = useProject();
  const router = useRouter();

  // Load statements for the project
  useEffect(() => {
    if (selectedProject) {
      fetch(`/api/statements?projectId=${selectedProject.id}&limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.statements) {
            setStatements(data.statements);
          }
        })
        .catch(err => {
          console.error('Error loading statements:', err);
        })
        .finally(() => setInitialLoading(false));
    }
  }, [selectedProject]);

  const handleInputChange = (field: keyof PersonEventFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleStatementChange = (_: any, newValue: Statement | null) => {
    setSelectedStatement(newValue);
    setFormData(prev => ({
      ...prev,
      statementId: newValue ? newValue.id : undefined
    }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.eventTitle.trim()) {
      errors.push('Event title is required');
    }

    if (!formData.eventDate) {
      errors.push('Event date is required');
    }

    if (!formData.relationshipType) {
      errors.push('Relationship type is required');
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
      setError('Please select a project');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the event
      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.eventTitle,
          date: formData.eventDate,
          end_date: formData.eventEndDate || null,
          location: formData.eventLocation || null,
          description: formData.eventDescription || null,
          projectId: selectedProject.id,
        }),
      });

      if (!eventResponse.ok) {
        const eventError = await eventResponse.json();
        throw new Error(eventError.error || 'Failed to create event');
      }

      const eventResult = await eventResponse.json();
      const eventId = eventResult.event.id;

      // Step 2: Create the person-event relation
      const relationResponse = await fetch('/api/person-event-relations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          person_id: personId,
          event_id: eventId,
          relationship_type: formData.relationshipType,
          statement_id: formData.statementId || undefined,
          projectId: selectedProject.id,
        }),
      });

      if (!relationResponse.ok) {
        const relationError = await relationResponse.json();
        throw new Error(relationError.error || 'Failed to create relationship');
      }

      const relationResult = await relationResponse.json();

      const message = `Event "${formData.eventTitle}" successfully created and linked to ${personName}`;
      
      if (onResult) {
        onResult({ 
          success: true, 
          message, 
          event: eventResult.event,
          relation: relationResult.relation 
        });
      } else {
        router.push('/persons');
      }
    } catch (err) {
      console.error('Error creating event and relationship:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event and relationship');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add Event to {personName}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Event Title */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Event Title"
                value={formData.eventTitle}
                onChange={handleInputChange('eventTitle')}
                required
                variant="outlined"
              />
            </Grid> 

            {/* Event Date */}
            <Grid size={{ xs: 12, sm: 6}}>
              <TextField
                fullWidth
                label="Event Date"
                type="date"
                value={formData.eventDate}
                onChange={handleInputChange('eventDate')}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Event End Date */}
            <Grid size={{ xs: 12, sm: 6}}>
              <TextField
                fullWidth
                label="End Date (Optional)"
                type="date"
                value={formData.eventEndDate}
                onChange={handleInputChange('eventEndDate')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Event Location */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Event Location"
                value={formData.eventLocation}
                onChange={handleInputChange('eventLocation')}
                variant="outlined"
              />
            </Grid>

            {/* Event Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Event Description"
                multiline
                rows={3}
                value={formData.eventDescription}
                onChange={handleInputChange('eventDescription')}
                variant="outlined"
              />
            </Grid>

            {/* Relationship Type */}
            <Grid size={{ xs: 12, sm: 6}}>
              <FormControl fullWidth>
                <InputLabel>Relationship Type</InputLabel>
                <Select
                  value={formData.relationshipType}
                  onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value }))}
                  label="Relationship Type"
                >
                  {VALID_RELATIONSHIP_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Statement */}
            <Grid size={{ xs: 12, sm: 6}}>
              <Autocomplete
                options={statements}
                getOptionLabel={(option) => option.content}
                value={selectedStatement}
                onChange={handleStatementChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Statement (Optional)"
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onClose && (
                  <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                  {submitting ? 'Creating...' : 'Create Event & Link'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
