'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab, Snackbar, Alert, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AuthForm from '@/app/components/ui/AuthForm';
import { validateEmail, validatePassword } from '@/app/lib/validation';

export default function LoginPage() {
  const [mode, setMode] = useState<'credentials' | 'email'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showResendSnackbar, setShowResendSnackbar] = useState(false);
  const router = useRouter();

  const handleCredentialsSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setShowResendSnackbar(false);

    try {
      // First check if the user exists and if their email is verified
      const userCheckResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (userCheckResponse.ok) {
        const userData = await userCheckResponse.json();
        
        if (!userData.emailVerified) {
          setUnverifiedEmail(data.email);
          setShowResendSnackbar(true);
          setError('Please verify your email address before signing in.');
          setIsLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: unverifiedEmail,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Verification email sent! Please check your inbox.');
        setShowResendSnackbar(false);
      } else {
        setError(result.error || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await signIn('email', {
        email: data.email,
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to send email. Please try again.');
      } else {
        setSuccess('Check your email for a sign-in link!');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const credentialsFields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email' as const,
      required: true,
      validation: validateEmail,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password' as const,
      required: true,
      validation: validatePassword,
    },
  ];

  const emailFields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email' as const,
      required: true,
      validation: validateEmail,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={mode}
          onChange={(_, newValue) => setMode(newValue)}
          centered
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab
            label="Sign in with Password"
            value="credentials"
          />
          <Tab
            label="Sign in with Email"
            value="email"
          />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {mode === 'credentials' ? (
          <AuthForm
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
            fields={credentialsFields}
            onSubmit={handleCredentialsSubmit}
            submitText="Sign In"
            isLoading={isLoading}
            error={error}
            success={success}
            footer={{
              text: "Don't have an account?",
              linkText: "Create one",
              linkHref: "/auth/register",
            }}
            mode="login"
          />
        ) : (
          <AuthForm
            title="Sign in with Email"
            subtitle="We'll send you a magic link to sign in"
            fields={emailFields}
            onSubmit={handleEmailSubmit}
            submitText="Send Magic Link"
            isLoading={isLoading}
            error={error}
            success={success}
            footer={{
              text: "Don't have an account?",
              linkText: "Create one",
              linkHref: "/auth/register",
            }}
            mode="login"
          />
        )}
        
      </Box>

      {/* Resend verification snackbar */}
      <Snackbar
        open={showResendSnackbar}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Alert
          severity="warning"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleResendVerification}
                disabled={isLoading}
                sx={{ color: 'inherit', borderColor: 'inherit' }}
              >
                Resend Email
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowResendSnackbar(false)}
                disabled={isLoading}
                sx={{ color: 'inherit' }}
              >
                Dismiss
              </Button>
            </Box>
          }
          sx={{ width: '100%' }}
        >
          Please verify your email address before signing in.
        </Alert>
      </Snackbar>
    </Box>
  );
} 