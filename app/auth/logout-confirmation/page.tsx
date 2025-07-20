'use client'

import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper
} from '@mui/material'
import CheckCircle from '@mui/icons-material/CheckCircle'
import { useRouter } from 'next/navigation'

export default function LogoutConfirmationPage() {
  const router = useRouter()

  const handleSignIn = () => {
    window.location.href = '/auth/login'
  }

  const handleGoHome = () => {
    router.push('/')
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
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <CheckCircle 
            sx={{ 
              fontSize: 64, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Successfully Logged Out
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            You have been successfully logged out of your account. 
            Your session has been cleared and you are no longer signed in.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              sx={{ minWidth: 140 }}
            >
              Sign In Again
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={handleGoHome}
              sx={{ minWidth: 140 }}
            >
              Go to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
} 