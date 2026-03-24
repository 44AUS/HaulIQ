import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { analyticsApi } from '../../services/api';
import { adaptHistory } from '../../services/adapters';

const ScoreIcon = ({ score }) => {
  if (score === 'green') return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
  if (score === 'yellow') return <RemoveIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
  return <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
};

export default function LoadHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.history()
      .then(data => setHistory(data.map(adaptHistory)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalNet = history.reduce((s, l) => s + (l.net || 0), 0);
  const totalGross = history.reduce((s, l) => s + (l.rate || 0), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography variant="h5" fontWeight={700}>Load History</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Your completed loads
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* Summary */}
          <Grid container spacing={3}>
            {[
              { label: 'Total Gross', value: `$${totalGross.toLocaleString()}`, highlight: false },
              { label: 'Total Net', value: `$${totalNet.toLocaleString()}`, highlight: true },
              { label: 'Loads Completed', value: history.length, highlight: false },
            ].map(({ label, value, highlight }) => (
              <Grid item xs={12} sm={4} key={label}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: highlight ? 'primary.main' : 'text.primary' }}>
                      {value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {history.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 10 }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="body1" color="text.secondary">No completed loads yet.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Date', 'Route', 'Miles', 'Rate', 'Net Profit', 'Broker', 'Score'].map(h => (
                        <TableCell
                          key={h}
                          sx={{
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            color: 'secondary.main',
                            bgcolor: 'action.hover',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((load, idx) => (
                      <TableRow
                        key={load.id}
                        sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="caption" color="text.secondary">{load.date}</Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={600}>{load.origin} → {load.dest}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{load.miles}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">${(load.rate || 0).toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: (load.net || 0) > 0 ? 'success.main' : 'error.main' }}
                          >
                            {(load.net || 0) >= 0 ? '+' : ''}${(load.net || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{load.broker}</Typography>
                        </TableCell>
                        <TableCell>
                          <ScoreIcon score={load.score} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
