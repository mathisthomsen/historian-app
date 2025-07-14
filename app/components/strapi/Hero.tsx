import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Image from 'next/image';

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://evidoxa.com/strapi';

function getBestImageUrl(image: any) {
  if (!image) return null;
  const url =
    image.formats?.large?.url ||
    image.formats?.medium?.url ||
    image.formats?.small?.url ||
    image.formats?.thumbnail?.url ||
    image.url;
  if (!url) return null;
  return url.startsWith('/') ? `${STRAPI_BASE_URL}${url}` : url;
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
          color="secondary.contrastText"  
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
          backdropFilter: 'blur(2px)',
          opacity: 0.85,
          color: 'secondary.contrastText',
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
            color: 'secondary.contrastText',
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