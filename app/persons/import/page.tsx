import CsvImporter from '../../components/data/ImportPersons';
import { Container, Typography } from '@mui/material';

export default function ImportPersonsPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Personen importieren
      </Typography>
      <CsvImporter />
    </Container>
  );
}
