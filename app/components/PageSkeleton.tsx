'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Typography,
} from '@mui/material';

interface PageSkeletonProps {
  showHeader?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showContent?: boolean;
  statsCount?: number;
  actionsCount?: number;
  contentRows?: number;
}

export default function PageSkeleton({
  showHeader = true,
  showStats = false,
  showActions = false,
  showContent = true,
  statsCount = 4,
  actionsCount = 4,
  contentRows = 5,
}: PageSkeletonProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Skeleton */}
        {showHeader && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width={300} height={48} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </Box>
            <Skeleton variant="text" width={400} height={24} />
          </Box>
        )}

        {/* Stats Cards Skeleton */}
        {showStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {Array.from({ length: statsCount }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                      <Box>
                        <Skeleton variant="text" width={60} height={32} />
                        <Skeleton variant="text" width={80} height={20} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Quick Actions Skeleton */}
        {showActions && (
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {Array.from({ length: actionsCount }).map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Skeleton variant="circular" width={56} height={56} sx={{ mx: 'auto', mb: 2 }} />
                      <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width={160} height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Content Skeleton */}
        {showContent && (
          <Card>
            <CardContent>
              <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: contentRows }).map((_, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="60%" height={20} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                    <Skeleton variant="text" width={80} height={16} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
} 