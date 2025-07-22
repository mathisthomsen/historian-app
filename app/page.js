'use client'

import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Divider,
  Link as MuiLink,
  useMediaQuery,
  CardHeader,
  IconButton,
  Avatar,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SecurityIcon from '@mui/icons-material/Security';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BookIcon from '@mui/icons-material/Book';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import LinkIcon from '@mui/icons-material/Link';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section with background image and overlay */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          minHeight: { xs: 400, md: 520 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background image */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            background: `url('/hero.jpeg') center/cover no-repeat, black`,
            '&:after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundColor: `black`,
              opacity: 0.6,
              zIndex: 1,
            },
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Stack spacing={4} alignItems="center">
            
            <Typography variant="h2" component="h1" sx={{ fontWeight: 700, color: 'primary.contrastText', fontSize: { xs: '2.2rem', md: '3.5rem' } }}>
              Historian App
            </Typography>
            <Typography variant="h5" sx={{ color: 'primary.contrastText', opacity: 0.95, maxWidth: 600, fontWeight: 400 }}>
              Die moderne Plattform zur Verwaltung, Analyse und Präsentation historischer Daten. Erfassen Sie Personen, Ereignisse, Beziehungen und Literatur – sicher, kollaborativ und intuitiv.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                href="/auth/register"
              >
                Jetzt registrieren
              </Button>
             
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section with subtle background and spacing */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 10 }, px: { xs: 0, md: 2 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" sx={{ fontWeight: 600, mb: 6, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Funktionen im Überblick
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {/* Personen */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card raised={true} sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 1, backgroundColor: 'background.default' }}>
                <CardHeader 
                title="Personen" 
                subheader="Erfassen, verwalten und verbinden." 
                sx={{ backgroundColor: 'background.default', color: 'text.primary', width: '100%' }}
                action={
                  <IconButton aria-label="settings">
                    <MoreVertIcon />
                  </IconButton>
                }
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><PersonIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardMedia align="center" sx={{ pt: 3, backgroundColor: 'secondary.light', width: '100%', height: '100%', p: 2 }}>
                  <Image src="/undraw_personal_information.svg" alt="Personen" width={240} height={240} loading="lazy" />
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 1 }} component='p' color="text.secondary">
                    Erfassen und verwalten Sie historische Persönlichkeiten mit allen relevanten Details, Biografien, Lebensdaten und komplexen Beziehungsnetzwerken. Erstellen Sie umfassende Profile mit Quellenangaben und wissenschaftlichen Anmerkungen.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Ereignisse */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card raised={true} sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 1, backgroundColor: 'background.default' }}>
                <CardHeader 
                title="Ereignisse" 
                subheader="Dokumentieren & referenzieren." 
                sx={{ backgroundColor: 'background.default', color: 'text.primary', width: '100%' }}
                action={
                  <IconButton aria-label="settings">
                    <MoreVertIcon />
                  </IconButton>
                }
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><EventIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardMedia align="center" sx={{ pt: 3, backgroundColor: 'secondary.light', width: '100%', height: '100%', p: 2 }}>
                  <Image src="/undraw_events.svg" alt="Ereignisse" width={240} height={240} loading="lazy" />
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 1 }} component='p' color="text.secondary">
                    Dokumentieren Sie bedeutende historische Ereignisse, Zeiträume und deren Zusammenhänge. Referenzieren Sie Ereignisse mit Quellen und verlinken Sie sie zu Personen und Orten.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Beziehungen */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card raised={true} sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 1, backgroundColor: 'background.default' }}>
                <CardHeader 
                title="Beziehungen" 
                subheader="Verlinken & deuten." 
                sx={{ backgroundColor: 'background.default', color: 'text.primary', width: '100%' }}
                action={
                  <IconButton aria-label="settings">
                    <MoreVertIcon />
                  </IconButton>
                }
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><LinkIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardMedia align="center" sx={{ pt: 3, backgroundColor: 'secondary.light', width: '100%', height: '100%', p: 2 }}>
                  <Image src="/undraw_connected_world.svg" alt="Beziehungen" width={240} height={240} loading="lazy" />
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 1 }} component='p' color="text.secondary">
                    Visualisieren Sie komplexe Beziehungsnetzwerke zwischen Personen, Ereignissen und Orten. Analysieren Sie Zusammenhänge und Entwicklungen.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Literatur */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card raised={true} sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 1, backgroundColor: 'background.default' }}>
                <CardHeader 
                title="Literatur" 
                subheader="Synchonisieren & kontextualisieren" 
                sx={{ backgroundColor: 'background.default', color: 'text.primary', width: '100%' }}
                action={
                  <IconButton aria-label="settings">
                    <MoreVertIcon />
                  </IconButton>
                }
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><BookIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardMedia align="center" sx={{ pt: 3, backgroundColor: 'secondary.light', width: '100%', height: '100%', p: 2 }}>
                  <Image src="/undraw_reading_time.svg" alt="Literatur" width={240} height={240} loading="lazy" />
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 1 }} component='p' color="text.secondary">
                    Verwalten Sie Quellen, Literatur und wissenschaftliche Arbeiten zentral und übersichtlich. Synchonisieren Sie Quellen mit Personen und Ereignissen.
                  </Typography>
                </CardContent>
              </Card>
              
            </Grid>
            {/* Analytics */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card raised={true} sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 1, backgroundColor: 'background.default' }}>
                <CardHeader 
                title="Analytics" 
                subheader="Analysieren & visualisieren" 
                sx={{ backgroundColor: 'background.default', color: 'text.primary', width: '100%' }}
                action={
                  <IconButton aria-label="settings">
                    <MoreVertIcon />
                  </IconButton>
                }
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><AnalyticsIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardMedia align="center" sx={{ pt: 3, backgroundColor: 'secondary.light', width: '100%', height: '100%', p: 2 }}>
                  <Image src="/undraw_data_trends.svg" alt="Anaytics" width={240} height={240} />
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 1 }} component='p' color="text.secondary">
                    Analysieren Sie Ihre Daten mit modernen Visualisierungen und gewinnen Sie neue Erkenntnisse.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Zusammenarbeit */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card raised={true} sx={{ maxWidth: 345, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 1, backgroundColor: 'background.default' }}>
                <CardHeader 
                title="Zusammenarbeit" 
                subheader="Arbeiten & teilen" 
                sx={{ backgroundColor: 'background.default', color: 'text.primary', width: '100%' }}
                action={
                  <IconButton aria-label="settings">
                    <MoreVertIcon />
                  </IconButton>
                }
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><PeopleIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardMedia align="center" sx={{ pt: 3, backgroundColor: 'secondary.light', width: '100%', height: '100%', p: 2 }}>
                  <Image src="/undraw_teamwork.svg" alt="Zusammenarbeit" width={240} height={240} loading="lazy" />
                </CardMedia>
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 1 }} component='p' color="text.secondary">
                   Arbeiten Sie gemeinsam an Projekten, teilen Sie Daten und profitieren Sie von Teamwork.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Workflow / Vorteile Section with responsive Stepper */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 4 }}>
            So funktioniert Historian App
          </Typography>
          <Stepper
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            activeStep={4}
            sx={{ mb: 6 }}
          >
            <Step key="Registrieren">
              <StepLabel>Registrieren</StepLabel>
            </Step>
            <Step key="Daten erfassen">
              <StepLabel>Daten erfassen</StepLabel>
            </Step>
            <Step key="Beziehungen knüpfen">
              <StepLabel>Beziehungen knüpfen</StepLabel>
            </Step>
            <Step key="Analysieren">
              <StepLabel>Analysieren</StepLabel>
            </Step>
            <Step key="Teilen & Zusammenarbeiten">
              <StepLabel>Teilen & Zusammenarbeiten</StepLabel>
            </Step>
          </Stepper>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ boxShadow: 2 }}>
                <CardHeader title="Sicher & DSGVO-konform" 
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><SecurityIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardContent>
                  <Typography variant="body1" color="text.secondary">
                    Ihre Daten sind geschützt und werden ausschließlich in der EU gespeichert. Moderne Authentifizierung sorgt für maximale Sicherheit.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ boxShadow: 2 }}>
              <CardHeader title="Intuitiv & Effizient" 
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}><LightbulbIcon /></Avatar>}
                titleTypographyProps={{
                  sx: {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'text.primary',
                  },
                }}
                />
                <CardContent>
                  <Typography variant="body1" color="text.secondary">
                    Die Benutzeroberfläche ist klar strukturiert und für Historiker:innen optimiert – keine Einarbeitungszeit nötig.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Impressions / Screenshots Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 600, mb: 4 }}>
          Unsere Vision & Mission
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ boxShadow: 2 }}>
              <CardMedia>
                <Image
                  loading="lazy"
                  src="/open.jpeg"
                  alt="Historische Bücher"
                  width={1000}
                  style={{ width: '100%', height: 220, objectFit: 'cover' }}
                />
              </CardMedia>
              <CardContent>
                <Typography variant="h6" color="text.primary">
                  Open Source & Open Innovation
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wir sind ein Open Source Projekt und setzen auf Open Innovation. Wir sind nicht nur ein Tool, sondern eine Community. Wir entwickeln unsere Tools gemeinsam und teilen uns unsere Erfahrungen.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ boxShadow: 2 }}>
              <CardMedia>
                <Image
                  loading="lazy"
                  src="/inter.jpeg"
                  alt="Teamarbeit"
                  width={1000}
                  style={{ width: '100%', height: 220, objectFit: 'cover' }}
                />
              </CardMedia>
              <CardContent>
                <Typography variant="h6" color="text.primary">
                  Interdisziplinär & Brückenbau
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wir sind ein interdisziplinäres Projekt und setzen auf Brückenbau zwischen Wissenschaft, Kunst und Technik. Erkenntnisse aus unterschiedlichsten Bereichen sollen miteinander verbunden werden.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action Section */}
      <Box sx={{ 
        background: `linear-gradient(170deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`, 
        py: { xs: 6, md: 8 }, 
        textAlign: 'center', 
        color: 'primary.contrastText' 
      }}>
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Jetzt loslegen und Historian App testen!
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Kostenlos registrieren und alle Funktionen entdecken.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              component={Link}
                              href="/auth/register"
            >
              Kostenlos registrieren
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              component={Link}
                              href="/auth/login"
            >
              Anmelden
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 3, mt: 'auto', borderTop: `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} Historian App. Alle Rechte vorbehalten.
            </Typography>
            <Stack direction="row" spacing={2}>
              <MuiLink component={Link} href="/impressum" color="text.secondary" underline="hover">
                Impressum
              </MuiLink>
              <MuiLink component={Link} href="/datenschutz" color="text.secondary" underline="hover">
                Datenschutz
              </MuiLink>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
