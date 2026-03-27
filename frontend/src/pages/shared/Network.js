import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, IconButton,
  Chip, CircularProgress, Divider, Menu, MenuItem,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth } from '../../context/AuthContext';
import { networkApi } from '../../services/api';

function ConnectionRow({ conn, onRemove, profilePath }) {
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, px: 0 }}>
        {/* Avatar */}
        <Avatar
          component={Link}
          to={profilePath(conn)}
          sx={{ width: 56, height: 56, fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none', flexShrink: 0, bgcolor: 'primary.dark' }}
        >
          {conn.name?.charAt(0) || '?'}
        </Avatar>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={Link}
            to={profilePath(conn)}
            variant="body1"
            fontWeight={700}
            noWrap
            sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
          >
            {conn.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>
            {conn.role}{conn.company ? ` · ${conn.company}` : ''}
          </Typography>
          {conn.mc_number && (
            <Typography variant="caption" color="text.disabled" noWrap>
              MC-{conn.mc_number}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Button
            component={Link}
            to={`/${conn.role === 'broker' ? 'broker' : 'carrier'}/messages?userId=${conn.user_id}`}
            variant="outlined"
            size="small"
            startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4, px: 2 }}
          >
            Message
          </Button>
          <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
            <MoreHorizIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem
              component={Link}
              to={profilePath(conn)}
              onClick={() => setAnchor(null)}
              sx={{ fontSize: '0.875rem' }}
            >
              View profile
            </MenuItem>
            <MenuItem
              onClick={() => { setAnchor(null); onRemove(conn.id); }}
              sx={{ fontSize: '0.875rem', color: 'error.main' }}
            >
              Remove connection
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Divider />
    </>
  );
}

function PendingRow({ req, onRespond, responding, profilePath }) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
        <Avatar
          component={Link}
          to={profilePath(req)}
          sx={{ width: 56, height: 56, fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none', flexShrink: 0, bgcolor: 'warning.dark' }}
        >
          {req.name?.charAt(0) || '?'}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={Link}
            to={profilePath(req)}
            variant="body1"
            fontWeight={700}
            noWrap
            sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
          >
            {req.name}
          </Typography>
          {req.company && (
            <Typography variant="body2" color="text.secondary" noWrap>{req.company}</Typography>
          )}
          <Typography variant="caption" color="text.disabled">Wants to connect with you</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CheckIcon sx={{ fontSize: 15 }} />}
            onClick={() => onRespond(req.id, true)}
            disabled={responding === req.id + '_accept'}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4 }}
          >
            Accept
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<CloseIcon sx={{ fontSize: 15 }} />}
            onClick={() => onRespond(req.id, false)}
            disabled={responding === req.id + '_decline'}
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4, color: 'text.secondary' }}
          >
            Ignore
          </Button>
        </Box>
      </Box>
      <Divider />
    </>
  );
}

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
    entry.role === 'carrier' ? `/c/${entry.user_id?.slice(0, 8)}` : `/b/${entry.user_id?.slice(0, 8)}`;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 720 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTimeIcon sx={{ color: 'warning.main', fontSize: 18 }} />
            <Typography variant="subtitle1" fontWeight={700}>Pending Requests</Typography>
            <Chip label={pending.length} size="small" color="warning" />
          </Box>
          <Divider />
          {pending.map(req => (
            <PendingRow
              key={req.id}
              req={req}
              onRespond={handleRespond}
              responding={responding}
              profilePath={profilePath}
            />
          ))}
        </Box>
      )}

      {/* Connections */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Connections</Typography>
          <Typography variant="body2" color="text.secondary">· {connections.length}</Typography>
        </Box>
        <Divider />

        {connections.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>No connections yet</Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
              {user?.role === 'broker'
                ? 'Add carriers from their profile page or Instant Book settings'
                : 'Brokers will appear here after you accept their connection requests'}
            </Typography>
          </Box>
        ) : (
          connections.map(conn => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              onRemove={handleRemove}
              profilePath={profilePath}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
