import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { Stack } from '@mui/material';
import Image from 'next/image';

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

function getBestImageUrl(image: any, size: 'medium' | 'small' | 'thumbnail' | 'large' | 'original' = 'medium') {
  if (!image) return null;
  if (size === 'large' && image.formats?.large?.url) return image.formats.large.url;
  if (size === 'medium' && image.formats?.medium?.url) return image.formats.medium.url;
  if (size === 'small' && image.formats?.small?.url) return image.formats.small.url;
  if (size === 'thumbnail' && image.formats?.thumbnail?.url) return image.formats.thumbnail.url;
  return image.url;
}

function renderCopy(copy: any[]) {
  if (!Array.isArray(copy)) return null;
  return copy.map((block, idx) => {
    if (block.type === 'paragraph') {
      return (
        <Typography key={idx} variant="body1" paragraph>
          {block.children?.map((child: any) => child.text || '').join('')}
        </Typography>
      );
    }
    return null;
  });
}

// Note: Parent page should have sx={{ mx: { xs: 2, md: 'auto' } }} for 16px margin on small screens
export default function TextImage({ Title, Image: Img, ImagePlaccement, Copy }: any) {
  const imageUrl = Img ? `${STRAPI_BASE_URL}${getBestImageUrl(Img, 'large')}` : undefined;
  const imageAlt = Img?.alternativeText || Title || '';
  const imagePlacementLeft = ImagePlaccement === 'left';

  return (
    <Box my={4} maxWidth="xl" sx={{ mx: { xs: 2, md: 4, xl: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <Grid
        container
        spacing={4}
        alignItems="center"
        sx={{
          flexDirection: {
            xs: 'column',
            md: imagePlacementLeft ? 'row' : 'row-reverse',
          },
        }}
      >
        {imageUrl && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                height: { xs: 240, sm: 320, md: 360, lg: 400 },
                overflow: 'hidden',
              }}
            >
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                style={{ objectFit: 'cover', borderRadius: 12 }}
                sizes="(max-width: 900px) 100vw, 50vw"
                priority={false}
                draggable={false}
              />
            </Box>
          </Grid>
        )}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="column" gap={2} alignItems="flex-start">
            <Typography variant="h4" component="h2" gutterBottom>
              {Title}
            </Typography>
            {renderCopy(Copy)}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
} 