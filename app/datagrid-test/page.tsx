import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const rows = [{ id: 1, col1: 'Hello' }, { id: 2, col1: 'World' }];
const columns = [{ field: 'col1', headerName: 'Col 1', width: 150 }];

export default function TestDataGrid() {
  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} />
    </Box>
  );
}