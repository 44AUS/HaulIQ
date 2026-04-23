import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, IconButton, Tooltip,
  CircularProgress, TextField, InputAdornment,
  ToggleButtonGroup, ToggleButton, Menu, MenuItem, Chip,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { networkApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

function profilePath(entry) {
  return entry.role === 'carrier'
    ? `/c/${(entry.user_id || entry.id)?.slice(0, 8)}`
    : `/b/${(entry.user_id || entry.id)?.slice(0, 8)}`;
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Connection row ────────────────────────────────────────────────────────────
function ConnectionRow({ conn, onRemove, userRole }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer', gap: 1.5 }}
    >
      <Avatar
        component={Link}
        to={profilePath(conn)}
        src={conn.avatar_url || undefined}
        sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, textDecoration: 'none' }}
      >
        {initials(conn.name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{conn.name}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ textTransform: 'capitalize' }}>
          {conn.role}{conn.company ? ` · ${conn.company}` : ''}
          {conn.mc_number ? ` · MC-${conn.mc_number}` : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <Tooltip title="Message">
          <IconButton size="small" component={Link} to={`/${userRole}/messages?userId=${conn.user_id}`} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
            <IonIcon name="chatbubble-outline" sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove">
          <IconButton size="small" onClick={() => onRemove(conn.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <IonIcon name="trash-outline" sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
          <IonIcon name="ellipsis-horizontal-outline" sx={{ fontSize: 17 }} />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem component={Link} to={profilePath(conn)} onClick={() => setAnchor(null)} sx={{ fontSize: '0.875rem' }}>
            View profile
          </MenuItem>
        </Menu>
      </Box>

      <IonIcon name="chevron-forward-outline" sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
}

// ─── Pending request row ───────────────────────────────────────────────────────
function PendingRow({ req, onRespond, responding }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }, gap: 1.5 }}>
      <Avatar
        component={Link}
        to={profilePath(req)}
        src={req.avatar_url || undefined}
        sx={{ width: 40, height: 40, bgcolor: 'warning.dark', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, textDecoration: 'none' }}
      >
        {initials(req.name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{req.name}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {req.company || 'Wants to connect with you'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <Tooltip title="Accept">
          <IconButton size="small" onClick={() => onRespond(req.id, true)} disabled={responding === req.id + '_accept'} sx={{ color: 'success.main' }}>
            <IonIcon name="checkmark-outline" sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ignore">
          <IconButton size="small" onClick={() => onRespond(req.id, false)} disabled={responding === req.id + '_decline'} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <IonIcon name="close-outline" sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <IonIcon name="chevron-forward-outline" sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
}

// ─── Suggestion / search result row ───────────────────────────────────────────
function SuggestRow({ user, onConnect, connecting }) {
  const status = user.connection_status;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer', gap: 1.5 }}>
      <Avatar
        component={Link}
        to={profilePath(user)}
        src={user.avatar_url || undefined}
        sx={{ width: 40, height: 40, bgcolor: 'secondary.dark', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, textDecoration: 'none' }}
      >
        {initials(user.name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{user.name}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ textTransform: 'capitalize' }}>
          {user.role}{user.company ? ` · ${user.company}` : ''}
          {user.mc_number ? ` · MC-${user.mc_number}` : ''}
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {status === 'accepted' ? (
          <Chip label="Connected" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
        ) : status === 'pending' ? (
          <Chip label="Pending" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem' }} />
        ) : (
          <Tooltip title="Connect">
            <IconButton size="small" onClick={() => onConnect(user)} disabled={connecting === user.user_id} sx={{ color: 'primary.main' }}>
              <IonIcon name="person-add-outline" sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <IonIcon name="chevron-forward-outline" sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
    </Box>
  );
}

// ─── Section header (matches Drivers group header) ────────────────────────────
function SectionHeader({ label, count }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 0.75, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
      <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.disabled', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.disabled' }}>
        {count}
      </Typography>
    </Box>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Network() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'connections';

  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [responding, setResponding] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    Promise.all([
      networkApi.list().catch(() => []),
      networkApi.requests().catch(() => []),
      networkApi.suggestions().catch(() => []),
    ]).then(([conns, reqs, suggs]) => {
      setConnections(Array.isArray(conns) ? conns : []);
      setPending(Array.isArray(reqs) ? reqs : []);
      setSuggestions(Array.isArray(suggs) ? suggs : []);
    }).finally(() => setLoading(false));
  }, []);

  const runSearch = useCallback((q) => {
    if (!q) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    networkApi.search(q, null)
      .then(res => setSearchResults(Array.isArray(res) ? res : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const handleRespond = (id, accepted) => {
    setResponding(id + (accepted ? '_accept' : '_decline'));
    networkApi.respond(id, accepted)
      .then(() => setPending(prev => prev.filter(r => r.id !== id)))
      .catch(() => {})
      .finally(() => setResponding(null));
  };

  const handleRemove = (id) => {
    networkApi.remove(id).then(() => setConnections(prev => prev.filter(c => c.id !== id))).catch(() => {});
  };

  const handleConnect = (targetUser) => {
    setConnecting(targetUser.user_id);
    networkApi.add(targetUser.user_id)
      .then(() => {
        const patch = list => list.map(u => u.user_id === targetUser.user_id ? { ...u, connection_status: 'pending' } : u);
        setSuggestions(patch);
        setSearchResults(patch);
      })
      .catch(err => alert(err.message || 'Failed to send connection request'))
      .finally(() => setConnecting(null));
  };

  const filteredConnections = query
    ? connections.filter(c => {
        const q = query.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.mc_number?.toLowerCase().includes(q);
      })
    : connections;

  const isSearchActive = Boolean(query);
  const rightColumnItems = isSearchActive
    ? searchResults.filter(u => u.connection_status !== 'accepted')
    : suggestions;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '10px', alignItems: 'center' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: 'background.paper', borderRadius: '8px', width: '100%', maxWidth: 1200, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

      {/* ── Header row ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, flexShrink: 0 }}>
        <Typography variant="h6" fontWeight={700}>Network</Typography>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v && navigate(`?tab=${v}`)}
          size="small"
          sx={{
            bgcolor: 'action.hover',
            borderRadius: '10px',
            p: '3px',
            gap: '2px',
            '& .MuiToggleButtonGroup-grouped': { border: '0 !important', borderRadius: '8px !important', mx: 0 },
            '& .MuiToggleButton-root': {
              fontSize: '0.78rem', fontWeight: 600, textTransform: 'none', px: 2, py: 0.55,
              color: 'text.secondary',
              '&.Mui-selected': { bgcolor: 'background.paper', color: 'text.primary', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', '&:hover': { bgcolor: 'background.paper' } },
              '&:hover': { bgcolor: 'transparent' },
            },
          }}
        >
          <ToggleButton value="connections" disableRipple>
            Connections {pending.length > 0 && `(${pending.length})`}
          </ToggleButton>
          <ToggleButton value="know" disableRipple>People You May Know</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Search bar ── */}
      <Box sx={{ px: 3, pb: 1.5, flexShrink: 0 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by name, company, or MC number…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IonIcon name="search-outline" sx={{ fontSize: 17, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: searching ? (
              <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
            ) : query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery('')}>
                  <IonIcon name="close-outline" sx={{ fontSize: 15 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {/* ── List ── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : activeTab === 'connections' ? (
          <>
            {/* Pending requests */}
            {pending.length > 0 && (
              <>
                <SectionHeader label="PENDING REQUESTS" count={pending.length} />
                {pending.map(req => (
                  <PendingRow key={req.id} req={req} onRespond={handleRespond} responding={responding} />
                ))}
              </>
            )}

            {/* Connections */}
            <SectionHeader label="MY CONNECTIONS" count={filteredConnections.length} />
            {filteredConnections.length === 0 ? (
              <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.disabled">
                  {isSearchActive ? 'No connections match your search' : 'No connections yet'}
                </Typography>
              </Box>
            ) : (
              filteredConnections.map(conn => (
                <ConnectionRow key={conn.id} conn={conn} onRemove={handleRemove} userRole={user?.role} />
              ))
            )}
          </>
        ) : (
          <>
            {/* People You May Know */}
            <SectionHeader label={isSearchActive ? 'SEARCH RESULTS' : 'SUGGESTED'} count={rightColumnItems.length} />
            {searching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} /></Box>
            ) : rightColumnItems.length === 0 ? (
              <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.disabled">
                  {isSearchActive ? 'No results found' : 'No suggestions right now'}
                </Typography>
              </Box>
            ) : (
              rightColumnItems.map(u => (
                <SuggestRow key={u.user_id} user={u} onConnect={handleConnect} connecting={connecting} />
              ))
            )}
          </>
        )}
      </Box>

    </Box>
    </Box>
  );
}
