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
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { ArrowBack, Visibility, VisibilityOff, Lock, CheckCircle, Error } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Reset password schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setSubmitStatus('error');
      setErrorMessage('No token found. Please use the link from your email.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: data.password }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitStatus('success');
        reset();
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?reset=success');
        }, 3000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
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
                Back to Login
              </MuiLink>
            </NextLink>
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            Reset Password
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter your new password below.
          </Typography>

          {submitStatus === 'success' && (
            <Alert 
              severity="success" 
              icon={<CheckCircle />}
              sx={{ mb: 3 }}
            >
              <Typography variant="body2">
                Password reset successfully! Redirecting to login...
              </Typography>
            </Alert>
          )}

          {submitStatus === 'error' && (
            <Alert 
              severity="error" 
              icon={<Error />}
              sx={{ mb: 3 }}
              onClose={() => setSubmitStatus('idle')}
            >
              <Typography variant="body2">
                {errorMessage}
              </Typography>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal" error={!!errors.password}>
                  <InputLabel>New Password</InputLabel>
                  <OutlinedInput
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    label="New Password"
                    startAdornment={
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errors.password && (
                    <FormHelperText>{errors.password.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal" error={!!errors.confirmPassword}>
                  <InputLabel>Confirm Password</InputLabel>
                  <OutlinedInput
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    startAdornment={
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {errors.confirmPassword && (
                    <FormHelperText>{errors.confirmPassword.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!isValid || isSubmitting}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Reset Password'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <NextLink href="/auth/login" style={{ textDecoration: 'none' }}>
                <MuiLink component="span" variant="body2">
                  Back to Login
                </MuiLink>
              </NextLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 