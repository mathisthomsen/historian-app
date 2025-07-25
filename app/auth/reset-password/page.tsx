'use client';
import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.main', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%', borderRadius: 3, textAlign: 'center' }}>
          <Alert severity="error">Invalid or expired reset link.</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.main', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%', borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Reset your password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your new password below.
          </Typography>
        </Box>
        {success ? (
          <Alert severity="success">Password reset! Redirecting to login...</Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              id="password"
              label="New password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              sx={{ mb: 3 }}
            />
            <TextField
              id="confirm"
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              fullWidth
              sx={{ mb: 3 }}
            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset password'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
} 