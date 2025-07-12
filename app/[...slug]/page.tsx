// pages/pages/[slug].js
import { strapi } from '@strapi/client';
import React from 'react';
import PageComponentRenderer from '../components/strapi/PageComponentRenderer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const client = strapi({ baseURL: 'http://localhost:1337/api' });

export async function generateStaticParams() {
  try {
    const res = await client.collection('content-pages').find();
    const pages = res.data || [];
    return pages
      .filter(page => typeof page.slug === 'string' && page.slug.length > 0)
      .map(page => ({
        slug: page.slug.split('/'),
      }));
  } catch (error) {
    console.warn('Strapi not available during build, skipping static params generation:', error);
    return [];
  }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const awaitedParams = await params;
  const slug = Array.isArray(awaitedParams.slug) ? awaitedParams.slug.join('/') : awaitedParams.slug;
  
  try {
    const res = await client.collection('content-pages').find({
      filters: { slug: { $eq: slug } },
      populate: {
        dynamic: {
          on: {
            'page-components.benefit-list': {
              populate: {
                Benefit: {
                  populate: ['Image'],
                },
              },
            },
            'page-components.text-image': {
              populate: ['Image'],
            },
            'page-components.hero': {
              populate: ['Image'],
            },
          },
        },
      },
    });
    const page = res.data[0] || null;
    if (!page) {
      return <Box py={8} textAlign="center"><Typography variant="h2">Not found</Typography></Box>;
    }
    return (
      <Box  sx={{ mx: { xl: 'auto'}, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }} >
        <PageComponentRenderer components={page.dynamic || []} />
      </Box>
    );
  } catch (error) {
    console.error('Error fetching page data:', error);
    return <Box py={8} textAlign="center"><Typography variant="h2">Error loading page</Typography></Box>;
  }
}

