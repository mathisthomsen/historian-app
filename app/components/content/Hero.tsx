'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Image from 'next/image';
import { keyframes } from '@mui/system';


function getBestImageUrl(image: any) {
  if (!image) return null;
  const url =
    image.formats?.large?.url ||
    image.formats?.medium?.url ||
    image.formats?.small?.url ||
    image.formats?.thumbnail?.url ||
    image.url;
  if (!url) return null;
  return url;
}

function getImageDimensions(image: any) {
  return {
    width: image?.width || 1600,
    height: image?.height || 900,
  };
}

function renderCopy(copy: any[]) {
  if (!Array.isArray(copy)) return null;
  return copy.map((block, idx) => {
    if (block.type === 'paragraph') {
      return (
        <Typography
          key={idx}
          variant="h5"
          sx={{
            mb: 3,
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            lineHeight: 1.5,
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {block.children?.map((child: any) => child.text || '').join('')}
        </Typography>
      );
    }
    return null;
  });
}

export default function Hero({ Title, Copy, ButtonLabel, Image: Img }: any) {
  const imageUrl = getBestImageUrl(Img);
  const imageAlt = Img?.alternativeText || Title || '';
  const { width, height } = getImageDimensions(Img);

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 320, md: 480, lg: 640, xl: 800 },
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        overflow: 'hidden',
        mb: 6,
        boxShadow: 3,
      }}
    >
      {/* Background image with Next.js Image */}
      {imageUrl && (
        <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
          <Image
            loading="eager"
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', filter: 'brightness(0.75) blur(0px)' }}
            priority={true}
            draggable={false}
          />
        </Box>
      )}
      {/* Overlay for text */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 3, sm: 5, md: 7 },
          maxWidth: { xs: '95%', sm: '80%', md: '60%' },
          textAlign: 'center',
          borderRadius: { xs: 2, sm: 3, md: 4 },
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 80px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(32px)',
          background: 'rgba(255, 255, 255, 0.1)',
          opacity: 0.92,
          color: 'text.primary',
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: 'clamp(1.5rem, 6vw, 2.8rem)',
            mb: 3,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'text.primary',
            textShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          {Title}
        </Typography>
        {renderCopy(Copy)}
        {ButtonLabel && (
          <Button
            variant="contained"
            size="large"
            sx={{ mt: 2, px: 5, py: 1.5, fontWeight: 600, fontSize: '1.1rem', borderRadius: 3 }}
          >
            {ButtonLabel}
          </Button>
        )}
      </Box>
      {/* Visually hidden image for SEO if needed */}
      {imageUrl && (
        <Box component="img" src={imageUrl} alt={imageAlt} sx={{ display: 'none' }} />
      )}
    </Box>
  );
} 

const circle1move = keyframes`
  0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
  20%  { transform: translate(30px, 20px) scale(1.08) rotate(8deg); }
  40%  { transform: translate(60px, -10px) scale(1.12) rotate(-6deg); }
  60%  { transform: translate(30px, 30px) scale(1.05) rotate(12deg); }
  80%  { transform: translate(-10px, 10px) scale(0.98) rotate(-8deg); }
  100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
`;
const circle2move = keyframes`
  0%   { transform: translate(0px, 0px) scale(1) rotate(0deg); }
  15%  { transform: translate(-20px, 25px) scale(0.92) rotate(-10deg); }
  35%  { transform: translate(-40px, -20px) scale(1.07) rotate(7deg); }
  55%  { transform: translate(-10px, 40px) scale(1.02) rotate(-14deg); }
  75%  { transform: translate(25px, 10px) scale(1.1) rotate(10deg); }
  100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
`;

export function HeroNoImage({ Title, Copy, ButtonLabel }: any) {
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Defer enhancement to idle time if possible
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setEnhanced(true));
      } else {
        setTimeout(() => setEnhanced(true), 200);
      }
    }
  }, []);
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 320, md: 480, lg: 640, xl: 800 },
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        overflow: 'hidden',
        mb: 6,
        boxShadow: 3,
        background: 'linear-gradient(170deg, #1f2c4c 80%, #009688 100%)',
      }}
    >
      {/* Progressive enhancement: static circles by default, animated+blur if enhanced */}
      <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '10%', md: '15%' },
            left: { xs: '10%', md: '20%' },
            width: { xs: 180, md: 320 },
            height: { xs: 180, md: 320 },
            borderRadius: '50%',
            bgcolor: 'rgba(0, 150, 136, 0.25)',
            filter: enhanced ? 'blur(2px)' : 'none',
            animation: enhanced ? `${circle1move} 18s linear infinite` : 'none',
            willChange: enhanced ? 'transform' : undefined,
            transition: 'filter 0.3s',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: '10%', md: '15%' },
            right: { xs: '10%', md: '20%' },
            width: { xs: 120, md: 220 },
            height: { xs: 120, md: 220 },
            borderRadius: '50%',
            bgcolor: 'rgba(0, 150, 136, 0.18)',
            filter: enhanced ? 'blur(2px)' : 'none',
            animation: enhanced ? `${circle2move} 22s linear infinite` : 'none',
            willChange: enhanced ? 'transform' : undefined,
            transition: 'filter 0.3s',
          }}
        />
      </Box>
      {/* Glassmorphism text layer, blur only if enhanced */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 3, sm: 5, md: 7 },
          maxWidth: { xs: '95%', sm: '80%', md: '60%' },
          textAlign: 'center',
          borderRadius: { xs: 2, sm: 3, md: 4 },
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 80px rgba(0, 0, 0, 0.25)',
          backdropFilter: enhanced ? 'blur(32px)' : 'none',
          background: 'rgba(255, 255, 255, 0.1)',
          opacity: 0.92,
          color: 'white',
          transition: 'backdrop-filter 0.3s',
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: 'clamp(1.5rem, 6vw, 2.8rem)',
            mb: 3,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            textShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          {Title}
        </Typography>
        {renderCopy(Copy)}
        {ButtonLabel && (
          <Button
            variant="contained"
            size="large"
            sx={{ mt: 2, px: 5, py: 1.5, fontWeight: 600, fontSize: '1.1rem', borderRadius: 3 }}
          >
            {ButtonLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
} 