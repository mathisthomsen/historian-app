'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { CheckCircle, Error, Email } from '@mui/icons-material';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Missing verification token or email');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          // Check if the error is because the user is already verified
          if (data.error === 'Invalid verification token') {
            // Check if the user is already verified
            const userCheckResponse = await fetch('/api/auth/check-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            });
            
            if (userCheckResponse.ok) {
              const userData = await userCheckResponse.json();
              if (userData.emailVerified) {
                setStatus('success');
                setMessage('Email is already verified! You can now sign in.');
                return;
              }
            }
          }
          
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleRedirect = () => {
    router.push('/auth/login');
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify your email address.
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 600 }}>
              Email Verified!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleRedirect}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Sign In
            </Button>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 600 }}>
              Verification Failed
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={handleRedirect}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Go to Login
            </Button>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Email sx={{ fontSize: 80, color: 'primary.main', mb: 3, opacity: 0.7 }} />
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Email Verification
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          We're verifying your email address to complete your registration.
        </Typography>

        {getStatusContent()}
      </Paper>
    </Box>
  );
} 