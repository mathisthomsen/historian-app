import CsvImporter from '../../components/ImportEvents';
import { Container, Typography } from '@mui/material';

export default function ImportEventsPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Events importieren
      </Typography>
      <CsvImporter />
    </Container>
  );
}
