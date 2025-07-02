'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import { Box, Typography, Container, Button, Stack } from '@mui/material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import EventTimeline from "../components/ChartsEvents";
import ModalDeleteConfirmation from '../components/ModalDeleteConfirmation';
import SiteHeader from '../components/SiteHeader';
import { api } from '../lib/api';

type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  end_date: string | null;
  location: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    try {
      const data = await api.get('/api/events');
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchEvents();
    };
    fetchData();
  }, []);

  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [plottedEvents, setPlottedEvents] = useState<Event[]>([]);
  const [gridKey, setGridKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleEdit = () => {
    if (selectedId) router.push(`/events/${selectedId}/edit`);
    setSelectedId(null);
    handleMenuClose();
  };

  const handleDetail = () => {
    if (selectedId) router.push(`/events/${selectedId}`);
    setSelectedId(null);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedId) {
      try {
        await api.delete(`/api/events/${selectedId}`);
        fetchEvents();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
    handleMenuClose();
  };

  const handlePlotRows = () => {
    const selected = events.filter((event) => selectedIds.includes(event.id));
    setPlottedEvents(selected);
  };

  const handleResetPlotRows = () => {
    setPlottedEvents([]);
    setSelectedIds([]);
    setGridKey((prev) => prev + 1);
  };

  const handleBulkdelete = async (ids: number[]) => {
    if (ids.length === 0) return;
    console.log('Bulk delete IDs (in handleBulkDelete):', ids);
    try {
      await api.delete('/api/events/bulk', ids);
      fetchEvents();
    } catch (error) {
      console.error('Fehler beim Bulk-Löschen:', error);
    }
  };

  const handleOpenDeleteModal = () => {
    if (selectedId !== null) {
      const event = events.find(e => e.id === selectedId);
      console.log('Open delete modal called. Event ID:', selectedId, 'Event:', event ? event.title : '');
    } else {
      console.log('Open delete modal called for bulk delete. IDs:', selectedIds);
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    console.log('Confirm delete called');
    if(selectedId === null && selectedIds != null) {
      console.log('Called with selectedIds:', selectedIds);
      await handleBulkdelete(selectedIds);
      setShowDeleteModal(false);
      return;
    } else if (selectedId != null) {
      console.log('Called with ID:', selectedId);
      await handleDelete();
      setShowDeleteModal(false);
      setSelectedId(null);
      return;
    }
  }
 

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'title', headerName: 'Titel', flex: 1, minWidth: 150 },
    { field: 'location', headerName: 'Ort', flex: 1, width: 150 },
    {
      field: 'date',
      headerName: 'Startdatum',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) =>
        params ? new Date(params).toLocaleDateString() : '',
    },
    {
      field: 'end_date',
      headerName: 'Enddatum',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) =>
        params ? new Date(params).toLocaleDateString() : '',
    },
    {
      field: 'description',
      headerName: 'Beschreibung',
      flex: 1,
      minWidth: 300,
      renderCell: (params) =>
        params.value ? params.value.slice(0, 100) + (params.value.length > 100 ? '…' : '') : '',
    },
    {
      field: 'actions',
      type: 'actions',
      width: 60,
      resizable: false,
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      renderCell: (params) => (
        <>
          <IconButton onClick={(e) => handleMenuOpen(e, params.row.id)}>
            <MoreVertIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 6 }}>
      <SiteHeader title="Ereignisse" showOverline={false} />
      {plottedEvents.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6">Ausgewählte Events</Typography>
          <EventTimeline events={plottedEvents} />
        </Box>
      )}
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" spacing={2} justifyContent="left" alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="error"
            sx={{ mt: 2 }}
            onClick={() => handleOpenDeleteModal()}
            disabled={selectedIds.length < 2}
          >
            Ausgewählte löschen
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePlotRows}
            disabled={selectedIds.length === 0}
          >
            Ausgewählte im Graph anzeigen
          </Button>
          <Button
            onClick={handleResetPlotRows}
            color="secondary"
            disabled={plottedEvents.length === 0}
          >
            Auswahl zurücksetzen
          </Button>
        </Stack>
        <DataGrid
          key={gridKey}
          checkboxSelection
          disableRowSelectionOnClick
          rows={events}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          onRowSelectionModelChange={(ids) => {
            setSelectedIds(Array.isArray(ids) ? ids.map(Number) : []);
          }}
          >
        </DataGrid>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleEdit()}>Bearbeiten</MenuItem>
          <MenuItem onClick={() => handleDetail()}>Details</MenuItem>
          <MenuItem onClick={handleOpenDeleteModal}>Löschen</MenuItem>
        </Menu>
      </Box>
      <ModalDeleteConfirmation
        open={showDeleteModal}
        itemName={
          selectedId === null && selectedIds != null
            ? `${selectedIds.length} ausgewählte Events`
            : `das Event "${events.find(e => e.id === selectedId)?.title ?? ''}"`
            
        }
        onConfirmAction={handleConfirmDelete}
        onCancelAction={() => {
          setShowDeleteModal(false);
          handleMenuClose();
        }}
      />

    </Container>
  );
}
