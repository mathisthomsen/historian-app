'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import NextLink from 'next/link';
import { ArrowBack } from '@mui/icons-material';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'If an account with this email exists, a password reset link has been sent.'
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'An error occurred while processing your request.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while processing your request.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ mb: 2 }}>
            <NextLink href="/auth/login" style={{ textDecoration: 'none' }}>
              <MuiLink
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <ArrowBack sx={{ mr: 1, fontSize: 20 }} />
                Zurück zum Login
              </MuiLink>
            </NextLink>
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            Passwort vergessen
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-Mail-Adresse"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              disabled={isLoading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || !email}
            >
              {isLoading ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <NextLink href="/auth/login" style={{ textDecoration: 'none' }}>
                <MuiLink component="span" variant="body2">
                  Zurück zum Login
                </MuiLink>
              </NextLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 