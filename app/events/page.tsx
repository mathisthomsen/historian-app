'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Typography, Container, Button, Stack, Skeleton } from '@mui/material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import ModalDeleteConfirmation from '../components/ModalDeleteConfirmation';
import SiteHeader from '../components/SiteHeader';
import { api } from '../lib/api';
import Drawer from '@mui/material/Drawer';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import EventForm from '../components/EventForm';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import RequireAuth from '../components/RequireAuth';

type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  end_date: string | null;
  location: string | null;
  subEventCount?: number;
};

type ApiResponse = {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState<any[]>([]);
  const [filterModel, setFilterModel] = useState<any>({ items: [] });

  const fetchEvents = useCallback(async (
    pageNum = page,
    limitNum = pageSize,
    sort = sortModel,
    filter = filterModel
  ) => {
    try {
      setDataLoading(true);
      setError(null);
      let sortParam = '';
      if (sort && sort.length > 0) {
        sortParam = `&sortField=${encodeURIComponent(sort[0].field)}&sortOrder=${encodeURIComponent(sort[0].sort || 'asc')}`;
      }
      let filterParam = '';
      if (filter && filter.items && filter.items.length > 0 && filter.items[0].value) {
        filterParam = `&filterField=${encodeURIComponent(filter.items[0].field)}&filterValue=${encodeURIComponent(filter.items[0].value)}`;
      }
      const parentIdParam = '&parentId=null';
      const data: ApiResponse = await api.get(`/api/events?page=${pageNum + 1}&limit=${limitNum}${sortParam}${filterParam}${parentIdParam}`);
      setEvents(data.events);
      setRowCount(data.pagination.total);
    } catch (error) {
      console.error('[fetchEvents] Fehler beim Laden der Events:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setDataLoading(false);
    }
  }, [page, pageSize, sortModel, filterModel]);

  useEffect(() => {
    console.log('[useEffect] Fetching events with', { page, pageSize, sortModel, filterModel });
    fetchEvents();
  }, [fetchEvents, filterModel, page, pageSize, sortModel]);

  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleEdit = () => {
    if (selectedId) {
      setEditEventId(selectedId);
      setDrawerOpen(true);
    }
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

  const handleOpenDeleteModal = () => {
    if (selectedId !== null) {
      const event = events.find(e => e.id === selectedId);
      console.log('Open delete modal called. Event ID:', selectedId, 'Event:', event ? event.title : '');
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    console.log('Confirm delete called');
    if (selectedId != null) {
      console.log('Called with ID:', selectedId);
      await handleDelete();
      setShowDeleteModal(false);
      setSelectedId(null);
      return;
    }
  };

  const handleCreate = () => {
    setEditEventId(null);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditEventId(null);
    fetchEvents();
  };

  const handleEventFormResult = (result: { success: boolean; message: string }) => {
    setSnackbarMsg(result.message);
    setSnackbarSeverity(result.success ? 'success' : 'error');
    setSnackbarOpen(true);
    handleDrawerClose();
  };

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
      field: 'subEventCount',
      headerName: 'Unter-Ereignisse',
      type: 'number',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: any) => params.row.subEventCount ?? 0,
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

  if (authLoading || !user) {
    return <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton variant="rectangular" height={56} width={300} /></Box>;
  }

  return (
    <RequireAuth>
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <SiteHeader title="Ereignisse" showOverline={false} />
        <Box sx={{ width: '100%' }}>
          <Stack direction="row" spacing={2} alignItems="right" sx={{ mb: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" color="secondary" onClick={() => router.push('/events/import')}>
              Ereignisse importieren
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreate}
            >
              Neues Event
            </Button>
            
          </Stack>
          {dataLoading || !Array.isArray(events) ? (
            <Box sx={{ width: '100%', height: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
            </Box>
          ) : (
            <DataGrid
              rows={events}
              columns={columns}
              columnVisibilityModel={{
                id: false,
              }}
              loading={dataLoading}
              getRowId={(row) => row.id}
              pagination
              paginationMode="server"
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={({ page: newPage, pageSize: newPageSize }) => {
                console.log('[DataGrid] Pagination changed', { newPage, newPageSize });
                setPage(newPage);
                setPageSize(newPageSize);
              }}
              rowCount={rowCount}
              pageSizeOptions={[25, 50, 100]}
              showToolbar={true}
              sortingMode="server"
              sortModel={sortModel}
              onSortModelChange={(model) => {
                console.log('[DataGrid] Sort model changed', model);
                setSortModel(model.slice());
              }}
              filterMode="server"
              filterModel={filterModel}
              onFilterModelChange={(model) => {
                console.log('[DataGrid] Filter model changed', model);
                setFilterModel(model);
              }}
              disableRowSelectionOnClick
            />
          )}

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => handleEdit()}>Bearbeiten</MenuItem>
            <MenuItem onClick={() => handleDetail()}>Details</MenuItem>
          </Menu>
          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={handleDrawerClose}
            sx={{
              '& .MuiDrawer-paper': {
                width: '500px',
                padding: 2,
              },
              zIndex: 1299,
            }}
          >
            <EventForm
              mode={editEventId ? 'edit' : 'create'}
              eventId={editEventId || undefined}
              onClose={handleDrawerClose}
              onResult={handleEventFormResult}
            />
          </Drawer>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              severity={snackbarSeverity}
              onClose={() => setSnackbarOpen(false)}
              sx={{ width: '100%' }}
            >
              {snackbarMsg}
            </Alert>
          </Snackbar>
        </Box>
        <ModalDeleteConfirmation
          open={showDeleteModal}
          itemName={`das Event "${events.find(e => e.id === selectedId)?.title ?? ''}"`}
          onConfirmAction={handleConfirmDelete}
          onCancelAction={() => {
            setShowDeleteModal(false);
            handleMenuClose();
          }}
        />
      </Container>
    </RequireAuth>
  );
}
