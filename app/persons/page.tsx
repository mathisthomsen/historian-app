'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Typography, Container, Button, Drawer, Snackbar, Alert } from '@mui/material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { api } from '../lib/api';
import type { GridSortModel, GridFilterModel } from '@mui/x-data-grid';
import PersonForm from '../components/PersonForm';
import RequireAuth from '../components/RequireAuth';

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

type ApiResponse = {
  persons: Person[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export default function PersonsPage() {
  const [rows, setRows] = useState<Person[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // DataGrid is 0-based
  const [pageSize, setPageSize] = useState(25);
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  const fetchPersons = async (
    pageNum = page,
    limitNum = pageSize,
    sort = sortModel,
    filter = filterModel
  ) => {
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
      const data: ApiResponse = await api.get(`/api/persons?page=${pageNum + 1}&limit=${limitNum}${sortParam}${filterParam}`);
      setRows(data.persons);
      setRowCount(data.pagination.total);
    } catch (error) {
      console.error('Fehler beim Laden der Personen:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortModel, filterModel]);

  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPersonId, setEditPersonId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleMenuOpen = (person: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(person.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleEdit = () => {
    if (selectedId) {
      setEditPersonId(selectedId);
      setDrawerOpen(true);
    }
    handleMenuClose();
  };

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

  const handleDetail = () => {
    if (selectedId) router.push(`/persons/${selectedId}`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedId) {
      try {
        await api.delete(`/api/persons/${selectedId}`);
        fetchPersons(); // Refresh the data
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
    handleMenuClose();
  };

  const handleBulkdelete = async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await api.delete('/api/persons/bulk', ids);
      fetchPersons(); // Refresh the data
    } catch (error) {
      console.error('Fehler beim Bulk-Löschen:', error);
    }
  };

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
          <IconButton onClick={(e) => handleMenuOpen(e, params.row.id)}>
            <MoreVertIcon />
          </IconButton>
        </>
      ),
    },
  ];

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

  return (
    <RequireAuth>
      <Container sx={{ mt: 6 }}>
        <SiteHeader title="Personen" showOverline={false} />
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCreate}
          >
            Neue Person
          </Button>
        </Box>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={dataLoading}
          getRowId={(row) => row.id}
          showToolbar={true}
          pagination
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: newPage, pageSize: newPageSize }) => {
            setPage(newPage);
            setPageSize(newPageSize);
          }}
          rowCount={rowCount}
          pageSizeOptions={[25, 50, 100]}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={(model) => setSortModel(model.slice())}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={(model) => setFilterModel(model)}
        />
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleDetail}>Details</MenuItem>
          <MenuItem onClick={handleEdit}>Stammdaten Bearbeiten</MenuItem>
          <MenuItem onClick={handleDelete}>Löschen</MenuItem>
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
      </Container>
    </RequireAuth>
  );
}
