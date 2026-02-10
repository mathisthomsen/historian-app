'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  LinearProgress,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import AuthForm from '../../components/ui/AuthForm';
import { validateEmail, validatePassword, validateName, validateConfirmPassword, getPasswordStrength } from '../../lib/utils/validation';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(getPasswordStrength(''));
  const [formData, setFormData] = useState<Record<string, string>>({});
  const router = useRouter();

  const handlePasswordChange = (password: string) => {
    setPasswordStrength(getPasswordStrength(password));
    setFormData(prev => ({ ...prev, password }));
  };

  const handleFormDataChange = (data: Record<string, string>) => {
    setFormData(data);
  };

  // Custom password validation that matches strength indicator logic
  const validatePasswordWithStrength = (password: string): string | null => {
    if (!password) return 'Password is required';
    
    const strength = getPasswordStrength(password);
    
    if (strength.score < 5) {
      return strength.feedback.length > 0 ? strength.feedback.join(', ') : 'Password is too weak';
    }
    
    return null;
  };

  const handleSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Get current password strength for the submitted password
    const currentStrength = getPasswordStrength(data.password);
    
    // Validate password strength - require score of 5 (all criteria met)
    if (currentStrength.score < 5) {
      setError(`Password is too weak. Please choose a stronger password. ${currentStrength.feedback.join(', ')}`);
      setIsLoading(false);
      return;
    }

    // Additional validation for password confirmation
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      setSuccess('Registration successful! Please check your email for a verification link to complete your account setup.');

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fields: {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password';
    required?: boolean;
    validation?: (value: string) => string | null;
  }[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      validation: validateName,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      validation: validateEmail,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      validation: (value: string): string | null => {
        if (!value) return 'Password is required';
        
        // Use exactly the same logic as getPasswordStrength
        let score = 0;
        const feedback: string[] = [];

        if (value.length >= 8) {
          score++;
        } else {
          feedback.push('At least 8 characters');
        }

        if (/[a-z]/.test(value)) {
          score++;
        } else {
          feedback.push('Include lowercase letters');
        }

        if (/[A-Z]/.test(value)) {
          score++;
        } else {
          feedback.push('Include uppercase letters');
        }

        if (/\d/.test(value)) {
          score++;
        } else {
          feedback.push('Include numbers');
        }

        if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          score++;
        } else {
          feedback.push('Include special characters');
        }
        
        // Always update the strength indicator
        handlePasswordChange(value);
        
        if (score < 5) {
          return feedback.length > 0 ? feedback.join(', ') : 'Password is too weak';
        }
        
        return null;
      },
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      required: true,
      validation: (value: string): string | null => {
        return validateConfirmPassword(formData.password || '', value);
      },
    },
  ];

  return (
    <Box sx={{ bgcolor: 'primary.main' }}>
      <AuthForm
        title="Create Account"
        subtitle="Join Historian App to start managing your historical research"
        fields={fields}
        onSubmitAction={handleSubmit}
        submitText="Create Account"
        isLoading={isLoading}
        error={error}
        success={success}
        footer={{
          text: "Already have an account?",
          linkText: "Sign in",
          linkHref: "/auth/login",
        }}
        mode="register"
        onFormDataChange={handleFormDataChange}
      />

      {/* Password Strength Indicator */}
      {passwordStrength.score > 0 && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, maxWidth: 300, bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Password Strength
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(passwordStrength.score / 5) * 100}
            color={passwordStrength.color}
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {passwordStrength.score === 5 
              ? 'Strong password! All requirements met.' 
              : passwordStrength.feedback.length > 0 
                ? passwordStrength.feedback.join(', ') 
                : 'Password strength indicator'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
} 