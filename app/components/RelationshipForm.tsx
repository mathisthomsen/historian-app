'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Autocomplete,
  Chip,
  Alert
} from '@mui/material';
import { Person, Add, Edit } from '@mui/icons-material';

interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
}

interface Relationship {
  id: number;
  personId: number;
  personName: string;
  relationType: string;
  isOutgoing: boolean;
  notes?: string;
  otherPerson: {
    id: number;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
  };
}

interface RelationshipFormData {
  id?: number;
  fromPersonId: number;
  toPersonId: number;
  relationType: string;
  notes?: string;
}

interface RelationshipFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (relationship: RelationshipFormData) => void;
  currentPerson: Person;
  allPersons: Person[];
  existingRelationship?: Relationship | RelationshipFormData;
  loading?: boolean;
}

// Define relationship types and their reciprocals
const RELATIONSHIP_TYPES = {
  // Family relationships
  'father': { label: 'Vater von', reciprocal: 'Kind von' },
  'mother': { label: 'Mutter von', reciprocal: 'Kind von' },
  'son': { label: 'Sohn von', reciprocal: 'Elternteil von' },
  'daughter': { label: 'Tochter von', reciprocal: 'Elternteil von' },
  'brother': { label: 'Bruder von', reciprocal: 'Geschwister von' },
  'sister': { label: 'Schwester von', reciprocal: 'Geschwister von' },
  'grandfather': { label: 'Großvater von', reciprocal: 'Enkelkind von' },
  'grandmother': { label: 'Großmutter von', reciprocal: 'Enkelkind von' },
  'grandson': { label: 'Enkel von', reciprocal: 'Großelternteil von' },
  'granddaughter': { label: 'Enkelin von', reciprocal: 'Großelternteil von' },
  'uncle': { label: 'Onkel von', reciprocal: 'Neffe/Nichte von' },
  'aunt': { label: 'Tante von', reciprocal: 'Neffe/Nichte von' },
  'nephew': { label: 'Neffe von', reciprocal: 'Onkel/Tante von' },
  'niece': { label: 'Nichte von', reciprocal: 'Onkel/Tante von' },
  
  // Marriage relationships
  'husband': { label: 'Ehemann von', reciprocal: 'Ehefrau von' },
  'wife': { label: 'Ehefrau von', reciprocal: 'Ehemann von' },
  'spouse': { label: 'Ehepartner von', reciprocal: 'Ehepartner von' },
  
  // Professional relationships
  'colleague': { label: 'Kollege von', reciprocal: 'Kollege von' },
  'boss': { label: 'Vorgesetzter von', reciprocal: 'Mitarbeiter von' },
  'employee': { label: 'Mitarbeiter von', reciprocal: 'Vorgesetzter von' },
  'mentor': { label: 'Mentor von', reciprocal: 'Mentee von' },
  'mentee': { label: 'Mentee von', reciprocal: 'Mentor von' },
  'teacher': { label: 'Lehrer von', reciprocal: 'Schüler von' },
  'student': { label: 'Schüler von', reciprocal: 'Lehrer von' },
  
  // Other relationships
  'friend': { label: 'Freund von', reciprocal: 'Freund von' },
  'neighbor': { label: 'Nachbar von', reciprocal: 'Nachbar von' },
  'acquaintance': { label: 'Bekannter von', reciprocal: 'Bekannter von' },
  'business_partner': { label: 'Geschäftspartner von', reciprocal: 'Geschäftspartner von' },
  'rival': { label: 'Rivale von', reciprocal: 'Rivale von' },
  'enemy': { label: 'Feind von', reciprocal: 'Feind von' }
} as const;

const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIP_TYPES).map(([key, value]) => ({
  value: key,
  label: value.label,
  reciprocal: value.reciprocal
}));

export default function RelationshipForm({
  open,
  onClose,
  onSubmit,
  currentPerson,
  allPersons,
  existingRelationship,
  loading = false
}: RelationshipFormProps) {
  const [formData, setFormData] = useState<RelationshipFormData>({
    fromPersonId: currentPerson.id,
    toPersonId: 0,
    relationType: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out current person from available persons
  const availablePersons = allPersons.filter(person => person.id !== currentPerson.id);

  useEffect(() => {
    if (existingRelationship) {
      // Check if it's a RelationshipFormData (has fromPersonId and toPersonId)
      if ('fromPersonId' in existingRelationship && 'toPersonId' in existingRelationship) {
        setFormData({
          id: existingRelationship.id,
          fromPersonId: existingRelationship.fromPersonId,
          toPersonId: existingRelationship.toPersonId,
          relationType: existingRelationship.relationType,
          notes: existingRelationship.notes || ''
        });
      } else {
        // It's a Relationship from the person detail page
        const rel = existingRelationship as Relationship;
        setFormData({
          id: rel.id,
          fromPersonId: rel.isOutgoing ? currentPerson.id : rel.otherPerson.id,
          toPersonId: rel.isOutgoing ? rel.otherPerson.id : currentPerson.id,
          relationType: rel.relationType,
          notes: rel.notes || ''
        });
      }
    } else {
      setFormData({
        fromPersonId: currentPerson.id,
        toPersonId: 0,
        relationType: '',
        notes: ''
      });
    }
    setErrors({});
  }, [existingRelationship, currentPerson.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.toPersonId) {
      newErrors.toPersonId = 'Bitte wählen Sie eine Person aus';
    }
    
    if (!formData.relationType) {
      newErrors.relationType = 'Bitte wählen Sie eine Beziehungsart aus';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const getPersonDisplayName = (person: Person) => {
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim();
    if (!name) return 'Unbekannt';
    
    let displayName = name;
    if (person.birth_date) {
      const birthYear = new Date(person.birth_date).getFullYear();
      if (person.death_date) {
        const deathYear = new Date(person.death_date).getFullYear();
        displayName += ` (${birthYear}-${deathYear})`;
      } else {
        displayName += ` (*${birthYear})`;
      }
    }
    
    return displayName;
  };

  const selectedPerson = availablePersons.find(p => p.id === formData.toPersonId);
  const selectedRelation = RELATIONSHIP_OPTIONS.find(r => r.value === formData.relationType);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {existingRelationship ? <Edit /> : <Add />}
          <Typography>
            {existingRelationship ? 'Beziehung bearbeiten' : 'Neue Beziehung hinzufügen'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Aktuelle Person: <strong>{getPersonDisplayName(currentPerson)}</strong>
            </Typography>
          </Box>

          <Box mb={3}>
            <Autocomplete
              options={availablePersons}
              getOptionLabel={(option) => getPersonDisplayName(option)}
              value={selectedPerson || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({ ...prev, toPersonId: newValue?.id || 0 }));
                setErrors(prev => ({ ...prev, toPersonId: '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Person auswählen"
                  error={!!errors.toPersonId}
                  helperText={errors.toPersonId}
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">
                      {getPersonDisplayName(option)}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Box>

          <Box mb={3}>
            <FormControl fullWidth error={!!errors.relationType} required>
              <InputLabel>Beziehungsart</InputLabel>
              <Select
                value={formData.relationType}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, relationType: e.target.value }));
                  setErrors(prev => ({ ...prev, relationType: '' }));
                }}
                label="Beziehungsart"
              >
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.relationType && (
                <Typography variant="caption" color="error">
                  {errors.relationType}
                </Typography>
              )}
            </FormControl>
          </Box>

          {selectedPerson && selectedRelation && (
            <Box mb={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>{getPersonDisplayName(currentPerson)}</strong> ist{' '}
                  <strong>{selectedRelation.label.toLowerCase()}</strong>{' '}
                  <strong>{getPersonDisplayName(selectedPerson)}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>{getPersonDisplayName(selectedPerson)}</strong> wird automatisch als{' '}
                  <strong>{selectedRelation.reciprocal.toLowerCase()}</strong>{' '}
                  <strong>{getPersonDisplayName(currentPerson)}</strong> markiert.
                </Typography>
              </Alert>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notizen (optional)"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Zusätzliche Informationen zur Beziehung..."
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={existingRelationship ? <Edit /> : <Add />}
          >
            {loading ? 'Speichern...' : (existingRelationship ? 'Aktualisieren' : 'Hinzufügen')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 