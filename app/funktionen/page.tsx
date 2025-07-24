import Hero from '../components/content/Hero';
import BenefitList from '../components/content/BenefitList';
import TextImage from '../components/content/TextImage';
import { Box, Container, Typography } from '@mui/material';

export default function FeaturesPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', paddingBlockEnd: 4 }} id="features_hero_box">
      <Box id="features_hero_container" sx={{ px: 0, width: '100%', paddingBlockEnd: 4 }}>
        <Hero
          Title="Willkommen bei Evidoxa!"
          Copy="Die moderne Plattform zur Verwaltung, Analyse und Präsentation historischer Daten. Erfassen Sie Personen, Ereignisse, Beziehungen und Literatur – sicher, kollaborativ und intuitiv."
          ButtonLabel="Jetzt starten"
          Image={{ url: '/hero.jpeg', alternativeText: 'Evidoxa Features Illustration' }}
        />
      </Box>
      <Container maxWidth="md" sx={{ mb: 8 }}>
        <BenefitList
          Title="Key Features"
          Benefit={[
            {
              id: 1,
              Title: 'Personenverwaltung',
              Copy: [
                { type: 'paragraph', children: [{ text: 'Verwalten Sie historische Personen mit allen relevanten Informationen.' }] }
              ],
              Image: { url: '/undraw_personal_information.svg', alternativeText: 'Personenverwaltung' }
            },
            {
              id: 2,
              Title: 'Ereignismanagement',
              Copy: [
                { type: 'paragraph', children: [{ text: 'Dokumentieren Sie historische Ereignisse und deren Zusammenhänge.' }] }
              ],
              Image: { url: '/undraw_teamwork.svg', alternativeText: 'Ereignismanagement' }
            },
            {
              id: 3,
              Title: 'Beziehungsnetzwerke',
              Copy: [
                { type: 'paragraph', children: [{ text: 'Visualisieren Sie komplexe Beziehungen zwischen Personen, Ereignissen und Orten.' }] }
              ],
              Image: { url: '/undraw_connected_world.svg', alternativeText: 'Beziehungsnetzwerke' }
            }
          ]}
        />
      </Container>
      <Container maxWidth="md">
        <TextImage
          Title="Intuitive Visualisierung"
          Copy="Nutzen Sie moderne Visualisierungen, um historische Daten verständlich und ansprechend darzustellen."
          Image={{ url: '/undraw_visual_data.svg', alternativeText: 'Visualisierung' }}
          ImagePosition="right"
        />
      </Container>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 2 }}>
          Bereit, Geschichte neu zu entdecken?
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 4, opacity: 0.8 }}>
          Registrieren Sie sich kostenlos und starten Sie mit Evidoxa!
        </Typography>
      </Container>
    </Box>
  );
} 