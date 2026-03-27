import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Avatar, Button, IconButton,
  Chip, Grid, CircularProgress, Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BusinessIcon from '@mui/icons-material/Business';
import TagIcon from '@mui/icons-material/Tag';
import { useAuth } from '../../context/AuthContext';
import { networkApi } from '../../services/api';

export default function Network() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    Promise.all([
      networkApi.list().catch(() => []),
      networkApi.requests().catch(() => []),
    ]).then(([conns, reqs]) => {
      setConnections(Array.isArray(conns) ? conns : []);
      setPending(Array.isArray(reqs) ? reqs : []);
    }).finally(() => setLoading(false));
  }, []);

  const handleRespond = (id, accepted) => {
    setResponding(id + (accepted ? '_accept' : '_decline'));
    networkApi.respond(id, accepted)
      .then(() => setPending(prev => prev.filter(r => r.id !== id)))
      .catch(() => {})
      .finally(() => setResponding(null));
  };

  const handleRemove = (id) => {
    networkApi.remove(id)
      .then(() => setConnections(prev => prev.filter(c => c.id !== id)))
      .catch(() => {});
  };

  const profilePath = (entry) =>
    entry.role === 'carrier' ? `/c/${entry.user_id?.slice(0,8)}` : `/b/${entry.user_id?.slice(0,8)}`;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <PeopleIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700}>My Network</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {user?.role === 'broker' ? "Carriers you've connected with" : "Brokers you're connected with"}
        </Typography>
      </Box>

      {/* Pending requests */}
      {pending.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 18 }} />
            <Typography variant="subtitle1" fontWeight={700}>Pending Requests</Typography>
            <Chip label={pending.length} size="small" color="warning" />
          </Box>
          <Grid container spacing={2}>
            {pending.map(req => (
              <Grid item xs={12} md={6} key={req.id}>
                <Card variant="outlined" sx={{ borderColor: 'warning.main', bgcolor: 'rgba(245,127,23,0.04)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'warning.dark', width: 40, height: 40, fontWeight: 700 }}>
                          {req.name?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{req.name}</Typography>
                          {req.company && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BusinessIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">{req.company}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <IconButton component={Link} to={profilePath(req)} size="small" title="View profile">
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontStyle="italic" display="block" sx={{ mb: 2 }}>
                      Wants to connect with you
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        fullWidth
                        startIcon={<CheckIcon />}
                        onClick={() => handleRespond(req.id, true)}
                        disabled={responding === req.id + '_accept'}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        fullWidth
                        startIcon={<CloseIcon />}
                        onClick={() => handleRespond(req.id, false)}
                        disabled={responding === req.id + '_decline'}
                      >
                        Decline
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Connections */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckIcon sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="subtitle1" fontWeight={700}>Connections</Typography>
          <Chip label={connections.length} size="small" color="primary" variant="outlined" />
        </Box>

        {connections.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>No connections yet</Typography>
              <Typography variant="caption" color="text.disabled">
                {user?.role === 'broker'
                  ? 'Add carriers from their profile page or the Instant Book settings'
                  : 'Brokers will appear here after you accept their connection requests'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {connections.map(conn => (
              <Grid item xs={12} md={6} lg={4} key={conn.id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: 'primary.dark', width: 40, height: 40, fontWeight: 700, flexShrink: 0 }}>
                          {conn.name?.charAt(0) || '?'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{conn.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{conn.role}</Typography>
                        </Box>
                      </Box>
                      <IconButton component={Link} to={profilePath(conn)} size="small" title="View profile" sx={{ flexShrink: 0 }}>
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                      {conn.company && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" noWrap>{conn.company}</Typography>
                        </Box>
                      )}
                      {conn.mc_number && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TagIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary">MC-{conn.mc_number}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        component={Link}
                        to={profilePath(conn)}
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        View Profile
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(conn.id)}
                        title="Remove connection"
                        sx={{ '&:hover': { color: 'error.main' } }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
