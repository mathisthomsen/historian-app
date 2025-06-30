'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import React, { use } from 'react';
import { useState } from 'react';

type ModalDeleteConfirmationProps = {
  open: boolean;
  itemName: string; // z.B. "das Event 'Zweiter Weltkrieg'"
  onConfirmAction: () => void;
  onCancelAction: () => void;
};

export default function ModalDeleteConfirmation({
  open,
  itemName,
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
        <DialogContentText>
          Willst du wirklich <strong>{itemName}</strong> löschen? Diese Aktion
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
