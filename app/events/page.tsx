'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Container, Button, Stack, Skeleton, Tooltip } from '@mui/material';
import type { GridSortModel, GridFilterModel, GridRowSelectionModel } from '@mui/x-data-grid';
import { IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import ModalDeleteConfirmation from '../components/ModalDeleteConfirmation';
import SiteHeader from '../components/SiteHeader';
import { api } from '../lib/api'; 
import Drawer from '@mui/material/Drawer';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import EventForm from '../components/EventForm';
import { useSession } from 'next-auth/react';
import RequireAuth from '../components/RequireAuth';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreIcon from '@mui/icons-material/MoreOutlined';

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
  const { data: session, status } = useSession();
  const authLoading = status === 'loading';
  const [events, setEvents] = useState<Event[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [searchValue, setSearchValue] = useState<string>('');
  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  // Fetch Events

  const fetchEvents = async (
    pageNum = page,
    limitNum = pageSize,
    sort = sortModel,
    filter = filterModel,
    search = searchValue
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
      let searchParam = '';
      if (search && search.trim()) {
        searchParam = `&search=${encodeURIComponent(search.trim())}`;
      }
      const parentIdParam = '&parentId=null';
      const url = `/api/events?page=${pageNum + 1}&limit=${limitNum}${sortParam}${filterParam}${searchParam}${parentIdParam}`;
      console.log('[fetchEvents] Calling URL:', url);
      const data = await api.get(url);
      
      // Check if the response contains an error
      if (data && data.error) {
        setEvents([]);
        setRowCount(0);
        setError(data.error);
        return;
      }
      
      if (data && Array.isArray(data.events) && data.pagination) {
        setEvents(data.events);
        setRowCount(data.pagination.total);
      } else {
        setEvents([]);
        setRowCount(0);
        setError('Fehler beim Laden der Daten');
      }
    } catch (error: any) {
      console.error('[fetchEvents] Fehler beim Laden der Events:', error);
      setEvents([]);
      setRowCount(0);
      
      // Handle authentication errors specifically
      if (error.message && error.message.includes('401')) {
        setError('Bitte melden Sie sich an, um die Daten zu sehen');
        // Optionally redirect to login
        router.push('/auth/login');
      } else if (error.message && error.message.includes('500')) {
        setError('Serverfehler beim Laden der Daten');
      } else {
        setError('Fehler beim Laden der Daten');
      }
    } finally {
      setDataLoading(false);
    }
  };  
  
  // State

  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [selectionSnackbarOpen, setSelectionSnackbarOpen] = useState(false);

  // Datagrid Tools

  const handleFilterModelChange = useCallback((model: GridFilterModel) => {
    console.log('[DataGrid] Filter model changed:', JSON.stringify(model, null, 2));
    
    // Check if there are quickFilterValues (this is how the search works)
    if (model.quickFilterValues && model.quickFilterValues.length > 0) {
      const searchValue = model.quickFilterValues[0];
      console.log('[DataGrid] Quick filter search detected:', searchValue);
      setSearchValue(searchValue);
      // Keep the filter model as is, but we'll handle search separately in API calls
      setFilterModel(model);
    } else {
      // This is a regular column filter
      console.log('[DataGrid] Regular column filter detected');
      setFilterModel(model);
      setSearchValue(''); // Clear search when using column filters
    }
  }, []);

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model.slice());
  }, []);

  const handlePaginationModelChange = useCallback(({ page: newPage, pageSize: newPageSize }: { page: number; pageSize: number }) => {
    console.log('[DataGrid] Pagination changed', { newPage, newPageSize });
    setPage(newPage);
    setPageSize(newPageSize);
  }, []);

  // Debounced filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 750); // 750ms debounce

    return () => clearTimeout(timeoutId);
  }, [filterModel, searchValue]);

  // Immediate effect for pagination and sorting
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortModel]);

  // Create Event

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

  // Deleting Row Selection

  const handleOpenDeleteModal = () => {
    const hasSelection = rowSelectionModel.type === 'include' ? rowSelectionModel.ids.size > 0 : 
                       rowSelectionModel.type === 'exclude' && rowSelectionModel.ids.size === 0;
    
    if (hasSelection) {
      let items;
      if (rowSelectionModel.type === 'include') {
        items = events.filter(e => rowSelectionModel.ids.has(e.id));
      } else {
        // For exclude type with empty set, all items are selected
        items = events;
      }
      console.log('Open delete modal called. Event IDs:', rowSelectionModel.type === 'include' ? Array.from(rowSelectionModel.ids) : 'ALL', 'Events:', items.map(e => e.title));
      setShowDeleteModal(true);
      setSelectionSnackbarOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    console.log('Confirm delete called');
    const hasSelection = rowSelectionModel.type === 'include' ? rowSelectionModel.ids.size > 0 : 
                       rowSelectionModel.type === 'exclude' && rowSelectionModel.ids.size === 0;
    
    if (hasSelection) {
      console.log('Called with selection model:', rowSelectionModel);
      await handleDeleteSelection();
      setShowDeleteModal(false);
      setRowSelectionModel({ type: 'include', ids: new Set() });
      setSnackbarMsg('Ereignisse erfolgreich gelöscht');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      return;
    }
  };

  const handleDeleteSelection = async () => {
    console.log('Delete selection called');
    console.log('Selected IDs:', rowSelectionModel.ids);
    
    let idsToDelete: number[];
    if (rowSelectionModel.type === 'include') {
      idsToDelete = Array.from(rowSelectionModel.ids).map(id => Number(id));
    } else {
      // For exclude type with empty set, delete all visible events
      idsToDelete = events.map(e => e.id);
    }
    
    if (idsToDelete.length > 0) {
      const res = await fetch(`/api/events/bulk`, {  
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify(idsToDelete),
      });
      if (res.ok) {
        console.log('Deleted selected IDs:', idsToDelete);
        fetchEvents();
        setRowSelectionModel({ type: 'include', ids: new Set() });
      } else {
        console.error('Failed to delete selected IDs');
      }
    }
  };

  // Row Selection

  const handleSelectionChange = (newModel: GridRowSelectionModel) => {
    console.log('handleSelectionChange called');
    console.log('New model: ', newModel);
    console.log('Row selection model: ', rowSelectionModel);
    console.log('Events: ', events);
    console.log('Row selection model changed:', newModel);
    
    // Check if any items are selected (either include with IDs or exclude with empty set = select all)
    const hasSelection = newModel.type === 'include' ? newModel.ids.size > 0 : 
                       newModel.type === 'exclude' && newModel.ids.size === 0;
    
    console.log('Has selection: ', hasSelection);

    setRowSelectionModel(newModel);
    console.log('Row selection model changed:', newModel);
    setSelectionSnackbarOpen(hasSelection);
  };

  // Columns

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, filterable: false },
    { field: 'title', headerName: 'Titel', flex: 1, minWidth: 150, filterable: true },
    { field: 'location', headerName: 'Ort', flex: 1, width: 150, filterable: true },
    {
      field: 'date',
      headerName: 'Startdatum',
      flex: 1,
      minWidth: 120,
      filterable: false,
      valueGetter: (params) =>
        params ? new Date(params).toLocaleDateString() : '',
    },
    {
      field: 'end_date',
      headerName: 'Enddatum',
      flex: 1,
      minWidth: 120,
      filterable: false,
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
      filterable: false,
      renderCell: (params: any) => params.row.subEventCount ?? 0,
    },
    {
      field: 'description',
      headerName: 'Beschreibung',
      flex: 1,
      minWidth: 300,
      filterable: true,
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
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            <Tooltip title="Details" placement="left">
              <IconButton onClick={(e) => router.push(`/events/${params.row.id}`)}>
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </>
      ),
    },
  ];

  // Skeleton

  if (authLoading || !session?.user) {
    return <Box sx={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton variant="rectangular" height={56} width={300} /></Box>;
  }

  // Main

  return (
    <RequireAuth>
      <Container maxWidth="xl" sx={{ position: 'relative', mt: 8 }}>
        <SiteHeader title="Ereignisse" showOverline={false}>
          <Button variant="outlined" color="secondary" onClick={() => router.push('/events/import')}>
            Ereignisse importieren
          </Button>
          <Button variant="contained" color="primary" onClick={handleCreate}>
            Neues Event
          </Button>
        </SiteHeader>  
          <DataGrid
            checkboxSelection
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={rowSelectionModel}
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
            onPaginationModelChange={handlePaginationModelChange}
            rowCount={rowCount}
            pageSizeOptions={[25, 50, 100]}
            showToolbar={true}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={handleFilterModelChange}
            disableRowSelectionOnClick
            filterDebounceMs={500}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { 
                  debounceMs: 750,
                },
              },
              
            }}
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'rgba(0, 0, 0, 0.075)',
              },
              '& .MuiDataGrid-cell': {
                color: 'text.primary',
                borderBottom: '.5px solid',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-row:has(.MuiDataGrid-cell:hover)': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          />

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
          <Snackbar
            open={selectionSnackbarOpen}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="info" 
              icon={<DeleteIcon />}
              action={
                <Button variant="contained" color="inherit" onClick={handleOpenDeleteModal}>
                  Löschen
                </Button>
              }
              sx={{ width: '100%' }}>
              <Typography variant="body1">
                {rowSelectionModel.ids.size == 1 ? 'Ein ausgewähltes Ereignis löschen.' : rowSelectionModel.ids.size + ' ausgewählte Ereignisse löschen.'}
              </Typography>
            </Alert>
          </Snackbar>
        <ModalDeleteConfirmation
          open={showDeleteModal}
          items={
            Array.isArray(events) && 
            ((rowSelectionModel.type === 'include' && rowSelectionModel.ids.size > 0) || 
             (rowSelectionModel.type === 'exclude' && rowSelectionModel.ids.size === 0)) 
            ? (rowSelectionModel.type === 'include' 
               ? events.filter(e => rowSelectionModel.ids.has(e.id)).map(e => e.title)
               : events.map(e => e.title))
            : []
          }
          onConfirmAction={handleConfirmDelete}
          onCancelAction={() => {
            setShowDeleteModal(false);
          }}
        /> 
      </Container>
    </RequireAuth>
  );
}
