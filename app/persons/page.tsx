'use client';

import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Typography, Container, Button } from '@mui/material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { api } from '../lib/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: ApiResponse = await api.get('/api/persons');
      setRows(data.persons); // Use the correct property name
    } catch (error) {
      console.error('Fehler beim Laden der Personen:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleMenuOpen = (person: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(person.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleEdit = () => {
    if (selectedId) router.push(`/persons/${selectedId}/edit`);
    handleMenuClose();
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
      valueGetter: (params: any) => {
        if (!params || !params.value) return '';
        return new Date(params.value as string).toLocaleDateString('de-DE');
      },
    },
    { field: 'birth_place', headerName: 'Geburtsort', minWidth: 150, flex: 1 },
    {
      field: 'death_date',
      headerName: 'Sterbedatum',
      minWidth: 130,
      flex: 1,
      valueGetter: (params: any) => {
        if (!params || !params.value) return '';
        return new Date(params.value as string).toLocaleDateString('de-DE');
      },
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

  if (loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <SiteHeader title="Personen" showOverline={false} />
        <LoadingSkeleton variant="table" rows={10} />
      </Container>
    );
  }

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
            onClick={fetchPersons}
            sx={{ mt: 2 }}
          >
            Erneut versuchen
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 6 }}>
      <SiteHeader title="Personen" showOverline={false} />
      <Box sx={{ width: '100%' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleBulkdelete(selectedIds)}
          sx={{ mb: 2 }}
          disabled={selectedIds.length === 0}
        >
          Ausgewählte löschen ({selectedIds.length})
        </Button>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
        />
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleDetail}>Details</MenuItem>
          <MenuItem onClick={handleEdit}>Stammdaten Bearbeiten</MenuItem>
          <MenuItem onClick={handleDelete}>Löschen</MenuItem>
        </Menu>
      </Box>
    </Container>
  );
}
