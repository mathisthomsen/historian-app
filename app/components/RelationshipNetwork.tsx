'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Person,
  Edit,
  Delete,
  Add,
  FamilyRestroom,
  Business,
  Favorite,
  Group
} from '@mui/icons-material';

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

interface RelationshipNetworkProps {
  currentPerson: Person;
  relationships: Relationship[];
  onAddRelationship: () => void;
  onEditRelationship: (relationship: Relationship) => void;
  onDeleteRelationship: (relationshipId: number) => void;
  loading?: boolean;
}

// Group relationships by type
const RELATIONSHIP_GROUPS = {
  family: {
    label: 'Familie',
    icon: <FamilyRestroom />,
    types: [
      // Direct
      'father', 'mother', 'son', 'daughter', 'brother', 'sister',
      'grandfather', 'grandmother', 'grandson', 'granddaughter',
      'uncle', 'aunt', 'nephew', 'niece',
      // Reciprocals
      'child', 'parent', 'sibling', 'grandchild', 'grandparent',
      'uncle/aunt', 'nephew/niece'
    ]
  },
  marriage: {
    label: 'Ehe & Partnerschaft',
    icon: <Favorite />,
    types: [
      'husband', 'wife', 'spouse'
      // Reciprocals are already included (spouse, husband, wife)
    ]
  },
  professional: {
    label: 'Beruflich',
    icon: <Business />,
    types: [
      'colleague', 'boss', 'employee', 'mentor', 'mentee', 'teacher', 'student'
      // Reciprocals are already included (colleague, boss, employee, mentor, mentee, teacher, student)
    ]
  },
  other: {
    label: 'Sonstige',
    icon: <Group />,
    types: [
      'friend', 'neighbor', 'acquaintance', 'business_partner', 'rival', 'enemy'
      // Reciprocals are already included (friend, neighbor, acquaintance, business_partner, rival, enemy)
    ]
  }
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Kind',
  mother: 'Kind',
  son: 'Vater',
  daughter: 'Elternteil',
  brother: 'Geschwister',
  sister: 'Geschwister',
  grandfather: 'Enkelkind',
  grandmother: 'Enkelkind',
  grandson: 'Großelternteil',
  granddaughter: 'Großelternteil',
  uncle: 'Neffe/Nichte',
  aunt: 'Neffe/Nichte',
  nephew: 'Onkel/Tante',
  niece: 'Onkel/Tante',
  husband: 'Ehemann',
  wife: 'Ehemann',
  spouse: 'Ehepartner',
  colleague: 'Kollege',
  boss: 'Mitarbeiter',
  employee: 'Vorgesetzter',
  mentor: 'Mentor',
  mentee: 'Mentee',
  teacher: 'Schüler',
  student: 'Lehrer',
  friend: 'Freund',
  neighbor: 'Nachbar',
  acquaintance: 'Bekannter',
  business_partner: 'Geschäftspartner',
  rival: 'Rivale',
  enemy: 'Feind',
  child: 'Elternteil',
  parent: 'Kind',
  sibling: 'Geschwister',
  grandchild: 'Großelternteil',
  grandparent: 'Großelternteil',
  'uncle/aunt': 'Neffe/Nichte',
  'nephew/niece': 'Onkel/Tante',
};

const getReciprocalRelation = (relationType: string): string => {
  const reciprocals: Record<string, string> = {
    father: 'Kind',
    mother: 'Kind',
    son: 'Elternteil',
    daughter: 'Elternteil',
    brother: 'Geschwister',
    sister: 'Geschwister',
    grandfather: 'Enkelkind',
    grandmother: 'Enkelkind',
    grandson: 'Großelternteil',
    granddaughter: 'Großelternteil',
    uncle: 'Neffe/Nichte',
    aunt: 'Neffe/Nichte',
    nephew: 'Onkel/Tante',
    niece: 'Onkel/Tante',
    husband: 'Ehefrau',
    wife: 'Ehemann',
    spouse: 'Ehepartner',
    colleague: 'Kollege',
    boss: 'Mitarbeiter',
    employee: 'Vorgesetzter',
    mentor: 'Mentee',
    mentee: 'Mentor',
    teacher: 'Schüler',
    student: 'Lehrer',
    friend: 'Freund',
    neighbor: 'Nachbar',
    acquaintance: 'Bekannter',
    business_partner: 'Geschäftspartner',
    rival: 'Rivale',
    enemy: 'Feind',
    child: 'Elternteil',
    parent: 'Kind',
    sibling: 'Geschwister',
    grandchild: 'Großelternteil',
    grandparent: 'Enkelkind',
    'uncle/aunt': 'Neffe/Nichte',
    'nephew/niece': 'Onkel/Tante',
  };
  return reciprocals[relationType] || relationType;
};

export default function RelationshipNetwork({
  currentPerson,
  relationships,
  onAddRelationship,
  onEditRelationship,
  onDeleteRelationship,
  loading = false
}: RelationshipNetworkProps) {
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Group relationships by category
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, Relationship[]> = {
      family: [],
      marriage: [],
      professional: [],
      other: []
    };

    relationships.forEach(rel => {
      for (const [groupKey, group] of Object.entries(RELATIONSHIP_GROUPS)) {
        if (group.types.includes(rel.relationType)) {
          groups[groupKey].push(rel);
          break;
        }
      }
    });

    return groups;
  }, [relationships]);

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

  const getRelationshipColor = (relationType: string) => {
    const group = Object.entries(RELATIONSHIP_GROUPS).find(([_, groupData]) => 
      groupData.types.includes(relationType)
    );
    
    switch (group?.[0]) {
      case 'family': return 'primary';
      case 'marriage': return 'secondary';
      case 'professional': return 'success';
      case 'other': return 'default';
      default: return 'default';
    }
  };

  const handleRelationshipClick = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setShowDetailsDialog(true);
  };

  const handleDelete = (relationshipId: number) => {
    onDeleteRelationship(relationshipId);
    setShowDetailsDialog(false);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Lade Beziehungen...</Typography>
      </Paper>
    );
  }

  if (relationships.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Keine Beziehungen vorhanden
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fügen Sie die erste Beziehung hinzu, um das Netzwerk zu erweitern.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddRelationship}
        >
          Erste Beziehung hinzufügen
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Add Relationship Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddRelationship}
        >
          Beziehung hinzufügen
        </Button>
      </Box>

      {/* Relationship Groups */}
      <Stack spacing={3}>
        {Object.entries(groupedRelationships).map(([groupKey, groupRelationships]) => {
          if (groupRelationships.length === 0) return null;
          
          const groupInfo = RELATIONSHIP_GROUPS[groupKey as keyof typeof RELATIONSHIP_GROUPS];
          
          return (
            <Paper key={groupKey} sx={{ p: 3 }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {groupInfo.icon}
                <Typography variant="h6">
                  {groupInfo.label} ({groupRelationships.length})
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                {groupRelationships.map((relationship) => (
                  <Card 
                    key={relationship.id} 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: 2,
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => handleRelationshipClick(relationship)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {relationship.personName}
                            </Typography>
                            <Chip
                              label={
                                relationship.isOutgoing
                                  ? getReciprocalRelation(relationship.relationType)
                                  : (RELATIONSHIP_LABELS[relationship.relationType] || relationship.relationType)
                              }
                              color={getRelationshipColor(relationship.relationType)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Bearbeiten">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditRelationship(relationship);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(relationship.id);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      {relationship.notes && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mt: 1, fontStyle: 'italic' }}
                        >
                          "{relationship.notes}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {/* Relationship Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="sm" fullWidth>
        {selectedRelationship && (
          <>
            <DialogTitle>
              Beziehungsdetails
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {getPersonDisplayName(currentPerson)} ↔ {selectedRelationship.personName}
                </Typography>
                <Chip
                  label={
                    selectedRelationship.isOutgoing
                      ? getReciprocalRelation(selectedRelationship.relationType)
                      : (RELATIONSHIP_LABELS[selectedRelationship.relationType] || selectedRelationship.relationType)
                  }
                  color={getRelationshipColor(selectedRelationship.relationType)}
                  sx={{ mb: 2 }}
                />
              </Box>
              
              {selectedRelationship.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notizen:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {selectedRelationship.notes}
                  </Typography>
                </Box>
              )}
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Personeninformationen:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedRelationship.personName}
                  </Typography>
                  {selectedRelationship.otherPerson.birthDate && (
                    <Typography variant="body2">
                      <strong>Geboren:</strong> {new Date(selectedRelationship.otherPerson.birthDate).toLocaleDateString('de-DE')}
                    </Typography>
                  )}
                  {selectedRelationship.otherPerson.deathDate && (
                    <Typography variant="body2">
                      <strong>Gestorben:</strong> {new Date(selectedRelationship.otherPerson.deathDate).toLocaleDateString('de-DE')}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailsDialog(false)}>
                Schließen
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  setShowDetailsDialog(false);
                  onEditRelationship(selectedRelationship);
                }}
              >
                Bearbeiten
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 