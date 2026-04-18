import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, CircularProgress, Alert, Skeleton,
} from '@mui/material';
import { waitlistApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


function RoleBadge({ role }) {
  if (role === 'carrier') {
    return (
      <Chip
        icon={<IonIcon name="car-sport-outline" sx={{ fontSize: 13 }} />}
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
      icon={<IonIcon name="briefcase-outline" sx={{ fontSize: 13 }} />}
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
  const [activating, setActivating] = useState(null);

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

  const handleActivate = async (entry) => {
    if (!window.confirm(`Activate account for ${entry.email}? They will be able to log in immediately.`)) return;
    setActivating(entry.id);
    try {
      await waitlistApi.activate(entry.id);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, activated: true } : e));
    } catch (e) {
      alert('Failed to activate: ' + e.message);
    } finally {
      setActivating(null);
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
            <IonIcon name="people-outline" color="primary" />
            <Typography variant="h5" fontWeight={700}>Waitlist</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">People waiting for early access to Urload</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <IonIcon name="refresh-outline" />}
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
      }}>
        {[
          { label: 'Total',    value: entries.length, color: 'text.primary' },
          { label: 'Carriers', value: carrierCount,   color: 'primary.main' },
          { label: 'Brokers',  value: brokerCount,    color: 'info.main' },
        ].map(({ label, value, color }) => (
          <Card variant="outlined" key={label}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

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
                    {[100, 140, 80, 100, 80, 80, 80, 80].map((w, j) => (
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
            <Typography variant="body2" color="text.secondary">
              {filter === 'all' ? 'No waitlist entries yet.' : `No ${filter}s on the waitlist yet.`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Name', 'Email', 'Role', 'Company', 'MC #', 'Joined', 'Status', ''].map((h, i) => (
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
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {entry.company || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {entry.mc_number || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.activated ? 'Activated' : 'Pending'}
                        size="small"
                        color={entry.activated ? 'success' : 'warning'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {!entry.activated && (
                          <IconButton
                            size="small"
                            onClick={() => handleActivate(entry)}
                            disabled={activating === entry.id}
                            title="Activate account"
                            sx={{ '&:hover': { color: 'success.main' } }}
                          >
                            {activating === entry.id
                              ? <CircularProgress size={14} color="inherit" />
                              : <IonIcon name="checkmark-circle-outline" sx={{ fontSize: 16 }} />
                            }
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          title="Remove from waitlist"
                          sx={{ '&:hover': { color: 'error.main' } }}
                        >
                          {deleting === entry.id
                            ? <CircularProgress size={14} color="inherit" />
                            : <IonIcon name="trash-outline" sx={{ fontSize: 16 }} />
                          }
                        </IconButton>
                      </Box>
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
