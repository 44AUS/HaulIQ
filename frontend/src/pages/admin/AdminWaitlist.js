import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, CircularProgress, Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WorkIcon from '@mui/icons-material/Work';
import { waitlistApi } from '../../services/api';

function RoleBadge({ role }) {
  if (role === 'carrier') {
    return (
      <Chip
        icon={<LocalShippingIcon sx={{ fontSize: 13 }} />}
        label="Carrier"
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontSize: 11 }}
      />
    );
  }
  return (
    <Chip
      icon={<WorkIcon sx={{ fontSize: 13 }} />}
      label="Broker"
      size="small"
      color="info"
      variant="outlined"
      sx={{ fontSize: 11 }}
    />
  );
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await waitlistApi.list();
      setEntries(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry from the waitlist?')) return;
    setDeleting(id);
    try {
      await waitlistApi.remove(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.role === filter);
  const carrierCount = entries.filter(e => e.role === 'carrier').length;
  const brokerCount = entries.filter(e => e.role === 'broker').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Waitlist</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">People waiting for early access to HaulIQ</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2}>
        {[
          { label: 'Total',    value: entries.length,  color: 'text.primary' },
          { label: 'Carriers', value: carrierCount,    color: 'primary.main' },
          { label: 'Brokers',  value: brokerCount,     color: 'info.main' },
        ].map(({ label, value, color }) => (
          <Grid item xs={4} key={label}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[
          { key: 'all',     label: `All (${entries.length})` },
          { key: 'carrier', label: `Carriers (${carrierCount})` },
          { key: 'broker',  label: `Brokers (${brokerCount})` },
        ].map(({ key, label }) => (
          <Button
            key={key}
            size="small"
            variant={filter === key ? 'contained' : 'outlined'}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </Box>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" color="text.secondary">
              {filter === 'all' ? 'No waitlist entries yet.' : `No ${filter}s on the waitlist yet.`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Name', 'Email', 'Role', 'Joined', ''].map((h, i) => (
                    <TableCell
                      key={i}
                      sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'secondary.main' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      {entry.name
                        ? <Typography variant="body2" fontWeight={600}>{entry.name}</Typography>
                        : <Typography variant="body2" color="text.disabled" fontStyle="italic">—</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{entry.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={entry.role} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        title="Remove from waitlist"
                        sx={{ '&:hover': { color: 'error.main' } }}
                      >
                        {deleting === entry.id
                          ? <CircularProgress size={14} color="inherit" />
                          : <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        }
                      </IconButton>
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
