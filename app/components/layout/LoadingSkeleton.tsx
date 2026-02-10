'use client';

import { Box, Skeleton, Stack, Paper } from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'table' | 'form' | 'card' | 'list';
  rows?: number;
  height?: number;
}

export default function LoadingSkeleton({ 
  variant = 'table', 
  rows = 5, 
  height = 56 
}: LoadingSkeletonProps) {
  const renderTableSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" width={150} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Stack>
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={height} sx={{ mb: 1 }} />
      ))}
    </Box>
  );

  const renderFormSkeleton = () => (
    <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
      <Skeleton variant="text" width={250} height={48} />
      <Skeleton variant="rectangular" height={56} />
      <Skeleton variant="rectangular" height={56} />
      <Skeleton variant="rectangular" height={56} />
      <Skeleton variant="rectangular" height={56} />
      <Skeleton variant="rectangular" height={100} />
      <Skeleton variant="rectangular" height={40} width={150} />
    </Stack>
  );

  const renderCardSkeleton = () => (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Stack spacing={2}>
        <Skeleton variant="circular" width={64} height={64} />
        <Skeleton variant="text" width={220} height={48} />
        <Skeleton variant="rectangular" height={100} />
        <Skeleton variant="rectangular" height={40} width={150} />
      </Stack>
    </Paper>
  );

  const renderListSkeleton = () => (
    <Stack spacing={2}>
      {[...Array(rows)].map((_, i) => (
        <Paper key={i} sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={60} height={32} />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const skeletons = {
    table: renderTableSkeleton,
    form: renderFormSkeleton,
    card: renderCardSkeleton,
    list: renderListSkeleton,
  };

  return skeletons[variant]();
} 