import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Image from 'next/image';

function getBestImageUrl(image: any) {
  if (!image) return null;
  const url =
    image.formats?.large?.url ||
    image.formats?.medium?.url ||
    image.formats?.small?.url ||
    image.formats?.thumbnail?.url ||
    image.url;
  if (!url) return  ;
  return url;
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

export default function BenefitList({ Title, Copy, Benefit }: any) {
  if (!Benefit || !Array.isArray(Benefit)) return null;

  return (
    <Box sx={{ py: 4, width: '100%', maxWidth: 1200 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
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
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' },
        gap: 3 
      }}>
        {Benefit.map((benefit: any, index: number) => {
          const imageUrl = getBestImageUrl(benefit.Image);
          const imageAlt = benefit.Image?.alternativeText || benefit.Title || '';
          
          return (
            <Card key={benefit.id || index} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {imageUrl && (
                <CardMedia sx={{ position: 'relative', height: 200 }}>
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'contain', position: 'relative' }}
                  />
                </CardMedia>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                {benefit.Title && (
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    {benefit.Title}
                  </Typography>
                )}
                {benefit.Copy && renderCopy(benefit.Copy)}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
} 