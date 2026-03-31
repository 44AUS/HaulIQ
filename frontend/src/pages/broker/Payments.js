import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Alert, Table, TableHead, TableBody, TableRow, TableCell, Button,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { freightPaymentsApi } from '../../services/api';

const STATUS_COLOR = {
  pending:  'warning',
  escrowed: 'info',
  released: 'success',
  refunded: 'default',
  failed:   'error',
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function BrokerPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await freightPaymentsApi.list();
      setPayments(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPaid     = payments.filter(p => ['escrowed','released'].includes(p.status)).reduce((s, p) => s + p.amount, 0);
  const inEscrow      = payments.filter(p => p.status === 'escrowed').reduce((s, p) => s + p.amount, 0);
  const totalReleased = payments.filter(p => p.status === 'released').reduce((s, p) => s + p.amount, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Payments</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Escrow payments you've made to carriers</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
          onClick={load}
          disabled={loading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2}>
        {[
          { label: 'Total Charged',  value: fmt(totalPaid),     color: 'text.primary' },
          { label: 'In Escrow',      value: fmt(inEscrow),      color: 'info.main' },
          { label: 'Released',       value: fmt(totalReleased), color: 'success.main' },
        ].map(({ label, value, color }) => (
          <Grid item xs={12} sm={4} key={label}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : payments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" color="text.secondary">No payments yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Route', 'Charged', 'Platform Fee', 'Carrier Gets', 'Status', 'Date', ''].map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {p.load_origin || '—'} → {p.load_destination || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{fmt(p.amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{fmt(p.fee_amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main" fontWeight={600}>{fmt(p.carrier_amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        size="small"
                        color={STATUS_COLOR[p.status] || 'default'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>{fmtDate(p.created_at)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="caption"
                        component={Link}
                        to={`/broker/active`}
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        View
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
