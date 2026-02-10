'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useProjectApi } from '../../hooks/useProjectApi';
import { CreateProjectData, UpdateProjectData, Project } from '../../types/project';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  project?: Project;
  onSuccess: () => void;
}

export default function ProjectForm({ open, onClose, mode, project, onSuccess }: ProjectFormProps) {
  const { fetchWithProject } = useProjectApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (project && mode === 'edit') {
      setFormData({
        name: project.name,
        description: project.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
    setError(null);
  }, [project, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const response = await fetchWithProject('/api/projects', {
          method: 'POST',
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create project');
        }
      } else {
        const response = await fetch(`/api/projects/${project?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update project');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateProjectData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Neues Projekt erstellen' : 'Projekt bearbeiten'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Projektname"
              value={formData.name}
              onChange={handleChange('name')}
              required
              fullWidth
              disabled={loading}
            />
            
            <TextField
              label="Beschreibung (optional)"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
              disabled={loading}
            />
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Speichern...' : mode === 'create' ? 'Erstellen' : 'Speichern'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 