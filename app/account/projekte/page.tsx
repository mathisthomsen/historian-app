'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Stack, 
  Alert, 
  Chip, 
  Card, 
  CardContent, 
  CardActions,
  IconButton,
  Skeleton,
  Grid,
  Divider,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../../components/layout/SiteHeader';
import RequireAuth from '../../components/layout/RequireAuth';
import ProjectForm from '../../components/forms/ProjectForm';
import ProjectMembers from '../../components/data/ProjectMembers';
import { Project } from '../../types/project';
import { api } from '../../lib';
import { useProject } from '../../contexts/ProjectContext';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function ProjektePage() {
  const router = useRouter();
  const { userProjects, isLoading, refreshProjects } = useProject();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Use projects from context
  const projects = userProjects;
  const dataLoading = isLoading;
  const error = null; // Context handles errors

  const handleCreateProject = () => {
    setFormMode('create');
    setSelectedProject(null);
    setFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setFormMode('edit');
    setSelectedProject(project);
    setFormOpen(true);
  };

  const handleManageMembers = (project: Project) => {
    setSelectedProject(project);
    setMembersOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setSnackbarMessage('Projekt erfolgreich gelöscht');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      refreshProjects();
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to delete project');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleFormSuccess = () => {
    setSnackbarMessage(formMode === 'create' ? 'Projekt erfolgreich erstellt' : 'Projekt erfolgreich aktualisiert');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    refreshProjects();
  };

  const handleMembersSuccess = () => {
    setSnackbarMessage('Mitglieder erfolgreich aktualisiert');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    refreshProjects();
  };

  const isOwner = (project: Project) => {
    // This should be based on the current user's ID
    return project.owner_id === project.owner.id; // Simplified for now
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'error';
      case 'editor': return 'warning';
      case 'viewer': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (project: Project) => {
    if (isOwner(project)) return 'Owner';
    const member = project.members.find((m: any) => m.user.id === project.owner.id);
    return member?.role || 'Member';
  };

  if (error) {
    return (
      <RequireAuth>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <SiteHeader title="Projekte" showOverline={false} />
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={refreshProjects}
            sx={{ mt: 2 }}
          >
            Erneut versuchen
          </Button>
        </Container>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <SiteHeader
          title="Projekte"
          showOverline={false}
        >
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
          >
            Neues Projekt
          </Button>
        </SiteHeader>

        {dataLoading ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {[1, 2, 3].map((i) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="40%" height={24} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine Projekte gefunden
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Erstellen Sie Ihr erstes Projekt, um zu beginnen
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
              sx={{ mt: 2 }}
            >
              Erstes Projekt erstellen
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {projects.map((project: any) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="h6" component="h3" noWrap>
                        {project.name}
                      </Typography>
                      <Chip 
                        label={getRoleLabel(project)} 
                        color={getRoleColor(getRoleLabel(project).toLowerCase()) as any}
                        size="small"
                      />
                    </Stack>
                    
                    {project.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {project.description}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      {project.members.length } Mitglieder • Erstellt am {new Date(project.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Stack direction="row" spacing={1}>
                      {isOwner(project) && (
                        <Tooltip title="Projekt bearbeiten">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditProject(project)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Mitglieder verwalten">
                        <IconButton 
                          size="small" 
                          onClick={() => handleManageMembers(project)}
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    
                    {isOwner(project) && (
                      <Tooltip title="Projekt löschen">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* Project Form Dialog */}
      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        project={selectedProject || undefined}
        onSuccess={handleFormSuccess}
      />

      {/* Project Members Dialog */}
      {selectedProject && (
        <ProjectMembers
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          project={selectedProject}
          onSuccess={handleMembersSuccess}
        />
      )}

      {/* Snackbar for notifications */}
      <Alert
        severity={snackbarSeverity}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          display: snackbarOpen ? 'flex' : 'none'
        }}
        onClose={() => setSnackbarOpen(false)}
      >
        {snackbarMessage}
      </Alert>
    </RequireAuth>
  );
}