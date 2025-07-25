'use client';
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.main', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Forgot your password?
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
        </Box>
        {submitted ? (
          <Alert severity="success">If an account with that email exists, a password reset link has been sent.</Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              sx={{ mb: 3 }}
            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send reset link'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
} 