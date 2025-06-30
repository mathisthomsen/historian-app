'use client'

import React from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Paper
} from '@mui/material'
import {
  Email,
  CheckCircle,
  Refresh
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

export default function CheckEmailPage() {
  const router = useRouter()

  const handleResendEmail = () => {
    // TODO: Implement resend email functionality
    console.log('Resend email clicked')
  }

  const handleBackToLogin = () => {
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
      <Container maxWidth="sm">
        <Card elevation={3} sx={{ textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Email 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main',
                  mb: 2
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                Check Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We&apos;ve sent a confirmation link to your email address.
              </Typography>
            </Box>

            <Alert 
              severity="info" 
              sx={{ mb: 3, textAlign: 'left' }}
            >
              <Typography variant="body2">
                <strong>What&apos;s next?</strong>
                <br />
                • Check your email inbox (and spam folder)
                <br />
                • Click the confirmation link in the email
                <br />
                • Return here to sign in once confirmed
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleResendEmail}
                sx={{ py: 1.5 }}
              >
                Resend Confirmation Email
              </Button>
              
              <Button
                variant="text"
                onClick={handleBackToLogin}
                sx={{ py: 1.5 }}
              >
                Back to Sign In
              </Button>
            </Box>

            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
} 