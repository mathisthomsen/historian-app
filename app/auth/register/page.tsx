'use client'

import React from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { useRouter } from 'next/navigation'
import RegisterForm from '../../components/auth/RegisterForm'

export default function RegisterPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()

  const handleSuccess = () => {
    // Could redirect to a "check your email" page
    router.push('/auth/check-email')
  }

  const handleSwitchToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Welcome content */}
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white', textAlign: isMobile ? 'center' : 'left' }}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2,
                  mb: 2
                }}
              >
                Join Historian App
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 400,
                  opacity: 0.9,
                  mb: 3,
                  fontSize: { xs: '1.2rem', md: '1.5rem' }
                }}
              >
                Start building your family tree and preserving your family&apos;s history
              </Typography>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  ✨ Create and manage family trees
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  📅 Track important life events
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  👥 Map family relationships
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  📊 Visualize your family history
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right side - Registration form */}
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
} 