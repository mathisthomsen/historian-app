'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Project, ProjectMember, InviteMemberData } from '../../types/project';

interface ProjectMembersProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onSuccess: () => void;
}

export default function ProjectMembers({ open, onClose, project, onSuccess }: ProjectMembersProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState<InviteMemberData>({
    email: '',
    role: 'member'
  });

  const isOwner = project.owner_id === project.owner.id;

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite member');
      }

      setInviteDialogOpen(false);
      setInviteData({ email: '', role: 'member' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'error';
      case 'editor': return 'warning';
      case 'viewer': return 'info';
      default: return 'default';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Projektmitglieder: {project.name}</Typography>
            {isOwner && (
              <Button
                variant="contained"
                onClick={() => setInviteDialogOpen(true)}
                disabled={loading}
              >
                Mitglied einladen
              </Button>
            )}
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Projektbesitzer
              </Typography>
              <ListItem>
                <ListItemText
                  primary={project.owner.name}
                  secondary={project.owner.email}
                />
                <Chip label="Owner" color="error" size="small" />
              </ListItem>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Mitglieder ({project.members.length})
              </Typography>
              <List>
                {project.members.map((member: any) => (
                  <ListItem key={member.id}>
                    <ListItemText
                      primary={member.user.name}
                      secondary={member.user.email}
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          label={member.role} 
                          color={getRoleColor(member.role) as any}
                          size="small"
                        />
                        {isOwner && member.role !== 'owner' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateRole(member.id, member.role === 'member' ? 'editor' : 'member')}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {project.members.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Keine Mitglieder"
                      secondary="Laden Sie Mitglieder ein, um zusammenzuarbeiten"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mitglied einladen</DialogTitle>
        <form onSubmit={handleInviteMember}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="E-Mail-Adresse"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData((prev: any) => ({ ...prev, email: e.target.value }))}
                required
                fullWidth
                disabled={loading}
              />
              
              <FormControl fullWidth>
                <InputLabel>Rolle</InputLabel>
                <Select
                  value={inviteData.role}
                  onChange={(e) => setInviteData((prev: any) => ({ ...prev, role: e.target.value as any }))}
                  disabled={loading}
                >
                  <MenuItem value="member">Mitglied</MenuItem>
                  <MenuItem value="editor">Editor</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setInviteDialogOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !inviteData.email.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Einladen...' : 'Einladen'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
} 