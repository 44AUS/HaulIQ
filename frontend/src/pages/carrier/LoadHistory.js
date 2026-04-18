import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Alert, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { analyticsApi } from '../../services/api';
import { adaptHistory } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';


const ScoreIcon = ({ score }) => {
  if (score === 'green') return <IonIcon name="trending-up-outline" sx={{ fontSize: 16, color: 'success.main' }} />;
  if (score === 'yellow') return <IonIcon name="remove-outline" sx={{ fontSize: 16, color: 'warning.main' }} />;
  return <IonIcon name="trending-down-outline" sx={{ fontSize: 16, color: 'error.main' }} />;
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
          <IonIcon name="time-outline" sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography variant="h5" fontWeight={700}>Load History</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Your completed loads
        </Typography>
      </Box>

      {loading ? (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[...Array(5)].map((_, i) => (
                    <TableCell key={i}><Skeleton variant="text" width={80} height={16} /></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[120, 100, 80, 80, 80].map((w, j) => (
                      <TableCell key={j}><Skeleton variant="text" width={w} height={18} /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* Summary */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Gross', value: `$${totalGross.toLocaleString()}`, highlight: false },
              { label: 'Total Net', value: `$${totalNet.toLocaleString()}`, highlight: true },
              { label: 'Loads Completed', value: history.length, highlight: false },
            ].map(({ label, value, highlight }) => (
              <Box key={label} sx={{ flex: '1 1 180px', minWidth: 0 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: highlight ? 'primary.main' : 'text.primary' }}>
                      {value}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {history.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 10 }}>
                <IonIcon name="time-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
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
