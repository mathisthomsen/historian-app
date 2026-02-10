'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowSelectionModel } from '@mui/x-data-grid';
import { Box, Typography, Container, Button, Drawer, Snackbar, Alert, Stack, Tooltip, Chip } from '@mui/material';
import { IconButton } from '@mui/material';
import MoreIcon from '@mui/icons-material/MoreOutlined';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/layout/SiteHeader';
import { api } from '../lib';
import type { GridSortModel, GridFilterModel } from '@mui/x-data-grid';
import PersonForm from '../components/forms/PersonForm';
import RequireAuth from '../components/layout/RequireAuth';
import ModalDeleteConfirmation from '../components/ui/ModalDeleteConfirmation';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProject } from '../contexts/ProjectContext';
import { useProjectApi } from '../hooks/useProjectApi';

type Person = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  notes: string | null;
};

export default function PersonsPage() {
  const { selectedProject, isLoading: projectLoading, canEdit, canDelete } = useProject();
  const { fetchWithProject } = useProjectApi();
  
  const [rows, setRows] = useState<Person[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // DataGrid is 0-based
  const [pageSize, setPageSize] = useState(25);
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [searchValue, setSearchValue] = useState<string>('');
  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });

  const fetchPersons = async (
    pageNum = page,
    limitNum = pageSize,
    sort = sortModel,
    filter = filterModel,
    search = searchValue
  ) => {
    // Don't fetch if no project is selected
    if (!selectedProject) {
      setRows([]);
      setRowCount(0);
      setDataLoading(false);
      return;
    }

    try {
      setDataLoading(true);
      setError(null);
      // Build query params for sorting
      let sortParam = '';
      if (sort && sort.length > 0) {
        sortParam = `&sortField=${encodeURIComponent(sort[0].field)}&sortOrder=${encodeURIComponent(sort[0].sort || 'asc')}`;
      }
      // Build query params for filtering (only supports one filter for now)
      let filterParam = '';
      if (filter && filter.items && filter.items.length > 0 && filter.items[0].value) {
        filterParam = `&filterField=${encodeURIComponent(filter.items[0].field)}&filterValue=${encodeURIComponent(filter.items[0].value)}`;
      }
      let searchParam = '';
      if (search && search.trim()) {
        searchParam = `&search=${encodeURIComponent(search.trim())}`;
      }
      // Add projectId to the query parameters
      const projectParam = `&projectId=${encodeURIComponent(selectedProject.id)}`;
      const data: any = await api.get(`/api/persons?page=${pageNum + 1}&limit=${limitNum}${sortParam}${filterParam}${searchParam}${projectParam}`);
      
      // Check if the response contains an error
      if (data && data.error) {
        setRows([]);
        setRowCount(0);
        setError(data.error);
        return;
      }
      
      setRows(data.persons);
      setRowCount(data.pagination.total);
    } catch (error: any) {
      console.error('Fehler beim Laden der Personen:', error);
      
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

  // Immediate effect for pagination and sorting
  useEffect(() => {
    fetchPersons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortModel, selectedProject]);

 

  // State

  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPersonId, setEditPersonId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [selectionSnackbarOpen, setSelectionSnackbarOpen] = useState(false);

  // Create Person

  const handleCreate = () => {
    setEditPersonId(null);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditPersonId(null);
    fetchPersons();
  };

  const handlePersonFormResult = (result: { success: boolean; message: string }) => {
    setSnackbarMsg(result.message);
    setSnackbarSeverity(result.success ? 'success' : 'error');
    setSnackbarOpen(true);
    handleDrawerClose();
  };

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
      fetchPersons();
    }, 750); // 750ms debounce

    return () => clearTimeout(timeoutId);
  }, [filterModel, searchValue]);

  // Deleting Row Selection

  const handleOpenDeleteModal = () => {
    const hasSelection = rowSelectionModel.type === 'include' ? rowSelectionModel.ids.size > 0 : 
                       rowSelectionModel.type === 'exclude' && rowSelectionModel.ids.size === 0;
    
    if (hasSelection) {
      let items;
      if (rowSelectionModel.type === 'include') {
        items = rows.filter(e => rowSelectionModel.ids.has(e.id));
      } else {
        // For exclude type with empty set, all items are selected
        items = rows;
      }
      console.log('Open delete modal called. Person IDs:', rowSelectionModel.type === 'include' ? Array.from(rowSelectionModel.ids) : 'ALL', 'Persons:', items.map(e => e.first_name + ' ' + e.last_name));
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
      setSnackbarMsg('Personen erfolgreich gelöscht');
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
      // For exclude type with empty set, delete all visible persons
      idsToDelete = rows.map(e => e.id);
    }
    
    if (idsToDelete.length > 0) {
      const res = await fetchWithProject(`/api/persons/bulk`, {  
        method: 'DELETE',
        body: JSON.stringify(idsToDelete),
      });
      if (res.ok) {
        console.log('Deleted selected IDs:', idsToDelete);
        fetchPersons();
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
    console.log('Persons: ', rows);
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
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'first_name', headerName: 'Vorname', minWidth: 150, flex: 1 },
    { field: 'last_name', headerName: 'Nachname', minWidth: 150, flex: 1 },
    {
      field: 'birth_date',
      headerName: 'Geburtsdatum',
      minWidth: 130,
      flex: 1,
      valueGetter: (params) =>
        params ? new Date(params).toLocaleDateString() : '',
    },
    { field: 'birth_place', headerName: 'Geburtsort', minWidth: 150, flex: 1 },
    {
      field: 'death_date',
      headerName: 'Sterbedatum',
      minWidth: 130,
      flex: 1,
      valueGetter: (params) =>
        params ? new Date(params).toLocaleDateString() : '',
    },
    { field: 'death_place', headerName: 'Sterbeort', minWidth: 150, flex: 1 },  
    { field: 'notes', headerName: 'Notizen', minWidth: 200, flex: 1,},
    {
      field: 'actions',
      type: 'actions',
      width: 60,
      headerName: '',
      sortable: false,
      filterable: false,
      align: 'right',
      renderCell: (params) => (
        <>
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            <Tooltip title="Details" placement="left">
              <IconButton onClick={(e) => router.push(`/persons/${params.row.id}`)}>
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </>
      ),
    },
  ];

  // Skeleton

  if (error) {
    return (
      <Container sx={{ mt: 6 }}>
        <SiteHeader title="Personen" showOverline={false} />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => fetchPersons()}
            sx={{ mt: 2 }}
          >
            Erneut versuchen
          </Button>
        </Box>
      </Container>
    );
  }

  // Main

  return (
    <RequireAuth>
      <Container maxWidth="xl" sx={{ position: 'relative', mt: 8 }}>
        <SiteHeader
        title="Personen"
        showOverline={false}
        >
          {selectedProject && (
            <Chip 
              label={selectedProject.name} 
              color="primary" 
              variant="outlined"
              size="small"
              sx={{ mr: 2 }}
            />
          )}
          {canEdit() && (
            <>
              <Button variant="outlined" color="secondary" onClick={() => router.push('/persons/import')}>
                Personen importieren
              </Button>
              <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreate}
                >
                  Neue Person
                </Button>
            </>
          )}
        </SiteHeader>
        {!selectedProject ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Kein Projekt ausgewählt
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bitte wählen Sie ein Projekt aus, um Personen anzuzeigen, oder erstellen Sie ein neues Projekt.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => router.push('/account/projekte')}
            >
              Projekt erstellen
            </Button>
          </Box>
        ) : (
          <DataGrid
            checkboxSelection={canDelete()}
            onRowSelectionModelChange={handleSelectionChange}
            keepNonExistentRowsSelected={true}
            rowSelectionModel={rowSelectionModel}
            rows={rows}
            columns={columns}
            columnVisibilityModel={{
              id: false,
            }}
            loading={dataLoading || projectLoading}
            getRowId={(row) => row.id}
            showToolbar={true}
            pagination
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={handlePaginationModelChange}
            rowCount={rowCount}
            pageSizeOptions={[25, 50, 100]}
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
        )}
        
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
          <PersonForm
            mode={editPersonId ? 'edit' : 'create'}
            personId={editPersonId || undefined}
            onClose={handleDrawerClose}
            onResult={handlePersonFormResult}
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
                canDelete() && (
                  <Button variant="contained" color="inherit" onClick={handleOpenDeleteModal}>
                    Löschen
                  </Button>
                )
              }
              sx={{ width: '100%' }}>
              <Typography variant="body1">
                {rowSelectionModel.ids.size == 1 ? 'Eine ausgewählte Person löschen.' : rowSelectionModel.ids.size + ' ausgewählte Personen löschen.'}
              </Typography>
            </Alert>
          </Snackbar>
      </Container>
      <ModalDeleteConfirmation
          open={showDeleteModal}
          items={
            Array.isArray(rows) && 
            ((rowSelectionModel.type === 'include' && rowSelectionModel.ids.size > 0) || 
             (rowSelectionModel.type === 'exclude' && rowSelectionModel.ids.size === 0)) 
            ? (rowSelectionModel.type === 'include' 
               ? rows.filter(e => rowSelectionModel.ids.has(e.id)).map(e => e.first_name + ' ' + e.last_name)
               : rows.map(e => e.first_name + ' ' + e.last_name))
            : []
          }
          onConfirmAction={handleConfirmDelete}
          onCancelAction={() => {
            setShowDeleteModal(false);
          }}
        /> 
    </RequireAuth>
  );
}
