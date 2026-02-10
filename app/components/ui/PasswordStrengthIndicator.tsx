'use client';

import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import { getPasswordStrength } from '../../lib/utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

export default function PasswordStrengthIndicator({ 
  password, 
  show = true 
}: PasswordStrengthIndicatorProps) {
  if (!show || !password) return null;

  const strength = getPasswordStrength(password);

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mt: 1,
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Password Strength
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: `${strength.color}.main`
            }}
          >
            {getStrengthText(strength.score)}
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={(strength.score / 5) * 100}
          color={strength.color}
          sx={{ height: 6, borderRadius: 3 }}
        />
        
        {strength.feedback.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              To improve your password:
            </Typography>
            <Stack spacing={0.5}>
              {strength.feedback.map((feedback, index) => (
                <Typography 
                  key={index} 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  • {feedback}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
} 