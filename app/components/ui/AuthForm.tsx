'use client';

import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link as MuiLink,
  Divider,
  Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import Link from 'next/link';

interface AuthFormProps {
  title: string;
  subtitle?: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password';
    required?: boolean;
    icon?: React.ReactNode;
    validation?: (value: string) => string | null;
  }[];
  onSubmitAction: (data: Record<string, string>) => void;
  submitText: string;
  isLoading?: boolean;
  error?: string;
  success?: string;
  footer?: {
    text: string;
    linkText: string;
    linkHref: string;
  };
  mode?: 'login' | 'register';
  onFormDataChange?: (data: Record<string, string>) => void;
}

export default function AuthForm({
  title,
  subtitle,
  fields,
  onSubmitAction,
  submitText,
  isLoading = false,
  error,
  success,
  footer,
  mode = 'login',
  onFormDataChange,
}: AuthFormProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = React.useState(false);

  const handleInputChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Notify parent component of form data changes
    if (onFormDataChange) {
      onFormDataChange(newFormData);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (name: string, value: string): string | null => {
    const field = fields.find(f => f.name === name);
    if (!field) return null;

    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      const value = formData[field.name] || '';
      const error = validateField(field.name, value);
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    if (!hasErrors) {
      onSubmitAction(formData);
    }
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'email':
        return <Email />;
      case 'password':
        return <Lock />;
      case 'name':
        return <Person />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        //minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 560,
          width: '100%',
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            {fields.map((field) => (
              <TextField
                key={field.name}
                name={field.name}
                label={field.label}
                type={
                  field.type === 'password' && !showPassword
                    ? 'password'
                    : field.type === 'password'
                    ? 'text'
                    : field.type
                }
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                fullWidth
                InputProps={{
                  startAdornment: field.icon || getFieldIcon(field.name) ? (
                    <InputAdornment position="start">
                      {field.icon || getFieldIcon(field.name)}
                    </InputAdornment>
                  ) : undefined,
                  endAdornment: field.type === 'password' ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            ))}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                submitText
              )}
            </Button>

            {footer && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {footer.text}{' '}
                  <Link href={footer.linkHref} passHref>
                    <MuiLink
                      component="span"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {footer.linkText}
                    </MuiLink>
                  </Link>
                </Typography>
              </Box>
            )}
          </Stack>
        </form>
      </Paper>
    </Box>
  );
} 