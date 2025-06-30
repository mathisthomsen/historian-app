'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material'
import { CheckCircle, Error } from '@mui/icons-material'

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Missing confirmation token')
        return
      }

      try {
        const response = await fetch(`/api/auth/confirm-email?token=${token}`, {
          method: 'GET',
        })

        if (response.ok) {
          setStatus('success')
          setMessage('Email confirmed successfully! You can now log in.')
          // Redirect to login with success message after a short delay
          setTimeout(() => {
            router.push('/auth/login?confirmed=true')
          }, 2000)
        } else {
          const errorData = await response.json()
          setStatus('error')
          setMessage(errorData.error || 'Failed to confirm email')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred while confirming your email')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleRegister = () => {
    router.push('/auth/register')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Confirming Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we confirm your email address...
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Email Confirmed!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Redirecting to login page...
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
            >
              Go to Login Now
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error.main">
              Confirmation Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleRegister}
              >
                Register Again
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleLogin}
              >
                Go to Login
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
} 