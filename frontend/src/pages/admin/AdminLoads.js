import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, TextField, InputAdornment,
  Chip, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Button, CircularProgress,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { adminApi } from '../../services/api';

const STATUS_COLORS = {
  active:   'success',
  booked:   'info',
  completed:'default',
  removed:  'error',
  expired:  'warning',
};

export default function AdminLoads() {
  const [loads, setLoads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [removing, setRemoving] = useState({});

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await adminApi.loads(params);
      const list = Array.isArray(data) ? data : (data.loads || []);
      setLoads(list);
      setTotal(Array.isArray(data) ? list.length : (data.total || list.length));
    } catch {
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const filtered = loads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.origin || '').toLowerCase().includes(q) ||
      (l.destination || '').toLowerCase().includes(q) ||
      (l.commodity || '').toLowerCase().includes(q)
    );
  });

  async function handleRemove(load) {
    if (!window.confirm(`Remove load ${load.origin} → ${load.destination}? This cannot be undone.`)) return;
    setRemoving(r => ({ ...r, [load.id]: true }));
    try {
      await adminApi.removeLoad(load.id);
      setLoads(prev => prev.map(l => l.id === load.id ? { ...l, status: 'removed' } : l));
    } catch (e) {
      alert(e.message);
    } finally {
      setRemoving(r => ({ ...r, [load.id]: false }));
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Load Moderation</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">{total} total loads on platform</Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by origin, destination, commodity…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'active', 'booked', 'completed', 'removed'].map(s => (
            <Button
              key={s}
              size="small"
              variant={statusFilter === s ? 'contained' : 'outlined'}
              color={s === 'removed' ? 'error' : s === 'booked' ? 'info' : 'primary'}
              onClick={() => setStatusFilter(s)}
              sx={{ textTransform: 'capitalize', minWidth: 72 }}
            >
              {s}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No loads found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Route', 'Type', 'Rate', 'Miles', 'Pickup', 'Status', 'Posted', 'Actions'].map(h => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'secondary.main', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(load => (
                  <TableRow key={load.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {load.origin} → {load.destination}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {(load.load_type || '').replace(/_/g, ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        ${load.rate?.toLocaleString() ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{load.miles?.toLocaleString() ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {load.pickup_date || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={load.status}
                        size="small"
                        color={STATUS_COLORS[load.status] || 'default'}
                        sx={{ fontSize: 11, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {load.posted_at ? new Date(load.posted_at).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {load.status !== 'removed' && (
                        removing[load.id] ? (
                          <CircularProgress size={16} />
                        ) : (
                          <IconButton
                            size="small"
                            title="Remove load"
                            onClick={() => handleRemove(load)}
                            sx={{ '&:hover': { color: 'error.main' } }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )
                      )}
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
