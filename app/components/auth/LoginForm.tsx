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

export default function LoginForm() {
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
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          href="/api/auth/login"
        >
          Sign in with SSO
        </Button>
      </CardContent>
    </Card>
  );
} 