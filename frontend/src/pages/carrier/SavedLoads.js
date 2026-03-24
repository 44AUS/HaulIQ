import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, CircularProgress, Card, CardContent, Alert
} from '@mui/material';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';

export default function SavedLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadsApi.savedList()
      .then(res => setLoads(adaptLoadList(res)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BookmarkAddedIcon sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography variant="h5" fontWeight={700}>Saved Loads</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {loads.length} loads saved
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : loads.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 10 }}>
            <BookmarkAddedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No saved loads yet.
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Bookmark loads from the Load Board to track them here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {loads.map(l => (
            <Grid item xs={12} sm={6} xl={4} key={l.id}>
              <LoadCard load={l} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
