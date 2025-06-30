'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Book as BookIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { api } from '../lib/api';

interface Literature {
  id: number;
  title: string;
  author: string;
  publicationYear?: number;
  type: string;
  description?: string;
  url?: string;
  createdAt: string;
}

export default function LiteraturePage() {
  const [literature, setLiterature] = useState<Literature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLiterature();
  }, []);

  const fetchLiterature = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/literature');
      setLiterature(data);
    } catch (err) {
      setError('Failed to load literature');
      console.error('Error fetching literature:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLiterature = literature.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'book':
        return 'primary';
      case 'article':
        return 'secondary';
      case 'journal':
        return 'success';
      case 'website':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Literature
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Box sx={{ mt: 1 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Literature
        </Typography>
        <Button
          component={Link}
          href="/literature/create"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ ml: 2 }}
        >
          Add Literature
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search literature by title, author, or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {filteredLiterature.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'No literature found matching your search' : 'No literature added yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start building your literature collection by adding your first entry'
              }
            </Typography>
            {!searchTerm && (
              <Button
                component={Link}
                href="/literature/create"
                variant="contained"
                startIcon={<AddIcon />}
              >
                Add Your First Literature Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredLiterature.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                      {item.title}
                    </Typography>
                    <Box>
                      <IconButton size="small" component={Link} href={`/literature/${item.id}/edit`}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    by {item.author}
                    {item.publicationYear && ` (${item.publicationYear})`}
                  </Typography>
                  
                  {item.description && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {item.description.length > 100 
                        ? `${item.description.substring(0, 100)}...`
                        : item.description
                      }
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={item.type} 
                      size="small" 
                      color={getTypeColor(item.type) as any}
                    />
                    {item.url && (
                      <Chip 
                        label="Online" 
                        size="small" 
                        variant="outlined"
                        component="a"
                        href={item.url}
                        target="_blank"
                        clickable
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 