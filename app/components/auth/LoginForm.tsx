'use client'

import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Divider,
  Link
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
  Email,
  Lock
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Login schema
const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean()
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: (user: any, tokens: any) => void
  onSwitchToRegister?: () => void
  onForgotPassword?: () => void
}

export default function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        
        // Store user info in localStorage (but not tokens - they're in cookies)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        if (onSuccess) {
          setTimeout(() => onSuccess(result.user, result), 1000)
        }
      } else {
        setSubmitStatus('error')
        setErrorMessage(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card elevation={3} sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your Historian App account
          </Typography>
        </Box>

        {submitStatus === 'success' && (
          <Alert 
            severity="success" 
            icon={<CheckCircle />}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              Login successful! Redirecting...
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
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.password}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  {...field}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                    />
                  }
                  label="Remember me"
                />
              )}
            />
            
            <Link
              component="button"
              variant="body2"
              onClick={onForgotPassword}
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              Forgot password?
            </Link>
          </Box>

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
              'Sign In'
            )}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Button
                variant="text"
                onClick={onSwitchToRegister}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Sign Up
              </Button>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
} 