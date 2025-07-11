import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { Stack } from '@mui/material';

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

function getBestImageUrl(image: any) {
  if (!image) return null;
  const url =
    image.formats?.medium?.url ||
    image.formats?.small?.url ||
    image.formats?.thumbnail?.url ||
    image.url;
  if (!url) return null;
  return url.startsWith('/') ? `${STRAPI_BASE_URL}${url}` : url;
}

export default function BenefitList({ Title, Benefit }: any) {
  return (
    <Box my={4} maxWidth="xl" sx={{ mx: { xs: 2, md: 4, xl: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        {Title}
      </Typography>
      <Grid container spacing={4}>
        {Array.isArray(Benefit) && Benefit.map((b: any) => {
          const imageUrl = getBestImageUrl(b.Image);
          const imageAlt = b.Image?.alternativeText || b.Title || '';
          return (
            <Grid 
            size={{ xs: 12, md: 4, lg: 3 }}
            p={3}
            sx={{
              borderColor: 'divider',
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: 'borderRadius',
              boxShadow: 2,
            }}
            key={b.id}>
              <Stack direction="column" gap={2} alignItems="center">
                {imageUrl && (
                  <img
                    loading="lazy"
                    src={imageUrl}
                    alt={imageAlt}
                    style={{
                      //maxWidth: 100,
                      height: 140,
                      marginBlockEnd: 2,
                    }}
                  />
                )}
                
                <Typography variant="h6" component="h3">
                {b.Title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                {b.Copy}
                </Typography>
            </Stack>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
} 