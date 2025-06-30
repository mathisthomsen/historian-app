'use client'

import * as React from 'react';
import Image from 'next/image'
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/permanent-marker';
import { Box, Stack } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '4rem' },
              lineHeight: 1.2,
              mb: 3
            }}
          >
            Historian App
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 400,
              opacity: 0.9,
              mb: 4,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            Manage vast amounts of historical data with precision and ease. 
            Document persons, events, locations, and literature for comprehensive research.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth/register')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100'
                },
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/auth/login')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h3"
          component="h2"
          gutterBottom
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            mb: 6,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Powerful Research Tools
        </Typography>

        <List sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 4 }} component="nav" aria-label="main mailbox folders">
          <ListItem alignItems="center" sx={{ gap: 4 }}>
            <ListItemAvatar>
              <Image
                src="/undraw_data-input.svg"
                width={200}
                height={200}
                alt="Data Input"
                loading="lazy"
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h5" gutterBottom component="h3">
                  Document Historical Data
                </Typography>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body1"
                    sx={{ color: 'text.primary', display: 'inline' }}
                  >
                    Create detailed entries for historical figures, events, locations, and literature sources. 
                    Everything remains clearly organized and interconnected for comprehensive research.
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          <Divider variant="inset" component="li" />
          <ListItem alignItems="center" sx={{ gap: 4, flexDirection: 'row-reverse' }}>
            <ListItemAvatar>
              <Image
                src="/undraw_mind-map.svg"
                width={200}
                height={200}
                alt="Mind Map"
                loading="lazy"
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h5" gutterBottom component="h3">
                  Connect Relationships and Context
                </Typography>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body1"
                    sx={{ color: 'text.primary', display: 'inline' }}
                  >
                    Link elements logically: Who was related to whom, involved in what events, 
                    or present at the same time and place? The data structure makes even complex 
                    historical constellations tangible.
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          <Divider variant="inset" component="li" />
          <ListItem alignItems="center" sx={{ gap: 4 }}>
            <ListItemAvatar>
              <Image
                src="/undraw_personal-information.svg"
                width={200}
                height={200}
                alt="Personal Information"
                loading="lazy"
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h5" gutterBottom component="h3">
                  Secure Data Management
                </Typography>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body1"
                    sx={{ color: 'text.primary', display: 'inline' }}
                  >
                    Your data belongs to you: Each user works initially in their own protected space. 
                    Later sharing or collaboration is possible but voluntary.
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
        </List>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'grey.50',
          py: { xs: 6, md: 8 },
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, mb: 3 }}
          >
            Ready to Start Your Research?
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Join historians worldwide in building comprehensive historical databases
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/auth/register')}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600
            }}
          >
            Create Free Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
