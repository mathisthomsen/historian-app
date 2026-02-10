'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListItem,
  List,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import React, { use } from 'react';
import { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';

type ModalDeleteConfirmationProps = {
  open: boolean;
  items: string[]; // z.B. "das Event 'Zweiter Weltkrieg'"
  onConfirmAction: () => void;
  onCancelAction: () => void;
};

export default function ModalDeleteConfirmation({
  open,
  items,
  onConfirmAction,
  onCancelAction,
}: ModalDeleteConfirmationProps) {

  const [loading, setLoading] = useState(false);
    const handleConfirm = async () => {
        setLoading(true);
        onConfirmAction();
        setLoading(false);
    };

  return (
    <Dialog open={open} onClose={onCancelAction}>
      <DialogTitle>Löschen bestätigen</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          Willst du wirklich 
          <List dense sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {items.map((item, index) => (
            <ListItem key={index}>  
                <ListItemIcon>
                  <DeleteIcon />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
          löschen? Diese Aktion
          kann nicht rückgängig gemacht werden.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelAction} color="inherit">
          Abbrechen
        </Button>
        <Button 
            onClick={handleConfirm} 
            loading={loading}
            disabled={loading}
            color="error" 
            variant="contained">
          Löschen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
