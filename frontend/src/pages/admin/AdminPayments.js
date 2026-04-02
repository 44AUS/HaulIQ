import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Alert, Table, TableHead, TableBody, TableRow, TableCell, Button,
  TextField, MenuItem, Skeleton,
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

const STATUS_LABEL = {
  pending:  'Pending',
  escrowed: 'In Escrow',
  released: 'Released',
  refunded: 'Refunded',
  failed:   'Failed',
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await freightPaymentsApi.adminList();
      setPayments(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? payments : payments.filter(p => p.status === statusFilter);

  const totalVolume   = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalFees     = payments.filter(p => ['escrowed','released'].includes(p.status)).reduce((s, p) => s + (p.fee_amount || 0), 0);
  const inEscrow      = payments.filter(p => p.status === 'escrowed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalReleased = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Freight Payments</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">All escrow payments across the platform</Typography>
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
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
      }}>
        {[
          { label: 'Total Volume',     value: fmt(totalVolume),   color: 'text.primary' },
          { label: 'In Escrow',        value: fmt(inEscrow),      color: 'info.main' },
          { label: 'Released',         value: fmt(totalReleased), color: 'success.main' },
          { label: 'Platform Revenue', value: fmt(totalFees),     color: 'primary.main' },
        ].map(({ label, value, color }) => (
          <Card variant="outlined" key={label}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" fontWeight={800} color={color}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="escrowed">In Escrow</MenuItem>
          <MenuItem value="released">Released</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} payment{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[...Array(8)].map((_, i) => (
                    <TableCell key={i}><Skeleton variant="text" width={80} height={16} /></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[140, 100, 100, 80, 80, 80, 80, 80].map((w, j) => (
                      <TableCell key={j}><Skeleton variant="text" width={w} height={18} /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" color="text.secondary">No payments found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Route', 'Broker', 'Carrier', 'Amount', 'Fee', 'Carrier Gets', 'Status', 'Date'].map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {p.load_origin || '—'} → {p.load_destination || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>{p.broker_name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{p.broker_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>{p.carrier_name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{p.carrier_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{fmt(p.amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="primary.main" fontWeight={600}>{fmt(p.fee_amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">{fmt(p.carrier_amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[p.status] || p.status}
                        size="small"
                        color={STATUS_COLOR[p.status] || 'default'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>{fmtDate(p.created_at)}</Typography>
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
