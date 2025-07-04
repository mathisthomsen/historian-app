'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar
} from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginForm from '../../components/auth/LoginForm'

export default function LoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    window.location.href = '/api/auth/login'
  }, [router])
  return null
}

export function LoginPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check if user just confirmed their email
    if (searchParams.get('confirmed') === 'true') {
      setSuccessMessage('Email confirmed successfully! You can now log in with your credentials.')
      setShowSuccessMessage(true)
    }
    // Check if user just reset their password
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Password reset successfully! You can now log in with your new password.')
      setShowSuccessMessage(true)
    }
  }, [searchParams])

  const handleSuccess = (user: any, tokens: any) => {
    // Redirect to dashboard or home page
    router.push('/dashboard')
  }

  const handleSwitchToRegister = () => {
    window.location.href = '/api/auth/register';
  }

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password')
  }

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false)
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
                Welcome Back
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
                Sign in to continue building your family&apos;s history
              </Typography>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  🔐 Secure authentication
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  📱 Access from any device
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  🔄 Sync across platforms
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  🛡️ Your data is protected
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right side - Login form */}
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={handleSwitchToRegister}
                onForgotPassword={handleForgotPassword}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Success message snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccessMessage} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
} 