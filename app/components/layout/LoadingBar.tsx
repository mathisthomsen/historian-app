'use client';

import { useState, useEffect } from 'react';
import { LinearProgress, Box } from '@mui/material';
import { usePathname } from 'next/navigation';

export default function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Start loading when pathname changes
    setLoading(true);
    setProgress(0);

    // Simulate progress
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prevProgress + 10;
      });
    }, 100);

    // Complete loading after a short delay
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 64, // Height of the AppBar
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2,
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 2,
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.2s ease',
          },
        }}
      />
    </Box>
  );
} 