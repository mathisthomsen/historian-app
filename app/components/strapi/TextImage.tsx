import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
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

function renderCopy(copy: any[]) {
  if (!Array.isArray(copy)) return null;
  return copy.map((block, idx) => {
    if (block.type === 'paragraph') {
      return (
        <Typography
          key={idx}
          variant="body1"
          sx={{
            mb: 2,
            lineHeight: 1.6,
          }}
        >
          {block.children?.map((child: any) => child.text || '').join('')}
        </Typography>
      );
    }
    return null;
  });
}

export default function TextImage({ Title, Copy, Image: Img, ImagePosition = 'right' }: any) {
  const imageUrl = getBestImageUrl(Img);
  const imageAlt = Img?.alternativeText || Title || '';

  return (
    <Box sx={{ py: 4, width: '100%', maxWidth: 1200 }}>
      <Grid container spacing={4} alignItems="center">
        {ImagePosition === 'left' && imageUrl && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
          </Grid>
        )}
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: 2 }}>
            {Title && (
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontWeight: 600,
                  mb: 3,
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                }}
              >
                {Title}
              </Typography>
            )}
            {renderCopy(Copy)}
          </Box>
        </Grid>

        {ImagePosition === 'right' && imageUrl && (
        <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
} 