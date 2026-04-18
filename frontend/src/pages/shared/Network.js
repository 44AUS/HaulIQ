import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, IconButton,
  Chip, CircularProgress, Divider, Menu, MenuItem,
  TextField, InputAdornment,
  Card, CardContent, Paper, Autocomplete, Skeleton,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { networkApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profilePath(entry) {
  return entry.role === 'carrier'
    ? `/c/${(entry.user_id || entry.id)?.slice(0, 8)}`
    : `/b/${(entry.user_id || entry.id)?.slice(0, 8)}`;
}

// ─── Connection row (left column) ─────────────────────────────────────────────

function ConnectionRow({ conn, onRemove, userRole }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
        <Avatar
          component={Link}
          to={profilePath(conn)}
          src={conn.avatar_url || undefined}
          sx={{ width: 48, height: 48, fontWeight: 700, textDecoration: 'none', flexShrink: 0, bgcolor: 'primary.dark' }}
        >
          {conn.name?.charAt(0) || '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={Link}
            to={profilePath(conn)}
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
          >
            {conn.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'capitalize', display: 'block' }}>
            {conn.role}{conn.company ? ` · ${conn.company}` : ''}
          </Typography>
          {conn.mc_number && (
            <Typography variant="caption" color="text.disabled" noWrap display="block">
              MC-{conn.mc_number}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Button
            component={Link}
            to={`/${userRole}/messages?userId=${conn.user_id}`}
            variant="outlined"
            size="small"
            startIcon={<IonIcon name="chatbubble-outline" sx={{ fontSize: 14 }} />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4, px: 1.5, fontSize: '0.75rem' }}
          >
            Message
          </Button>
          <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
            <IonIcon name="ellipsis-horizontal-outline" sx={{ fontSize: 18 }} />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem component={Link} to={profilePath(conn)} onClick={() => setAnchor(null)} sx={{ fontSize: '0.875rem' }}>
              View profile
            </MenuItem>
            <MenuItem onClick={() => { setAnchor(null); onRemove(conn.id); }} sx={{ fontSize: '0.875rem', color: 'error.main' }}>
              Remove connection
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Divider />
    </>
  );
}

// ─── Pending request row ───────────────────────────────────────────────────────

function PendingRow({ req, onRespond, responding }) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
        <Avatar
          component={Link}
          to={profilePath(req)}
          src={req.avatar_url || undefined}
          sx={{ width: 48, height: 48, fontWeight: 700, textDecoration: 'none', flexShrink: 0, bgcolor: 'warning.dark' }}
        >
          {req.name?.charAt(0) || '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={Link}
            to={profilePath(req)}
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
          >
            {req.name}
          </Typography>
          {req.company && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">{req.company}</Typography>
          )}
          <Typography variant="caption" color="text.disabled">Wants to connect with you</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<IonIcon name="checkmark-outline" sx={{ fontSize: 14 }} />}
            onClick={() => onRespond(req.id, true)}
            disabled={responding === req.id + '_accept'}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4, px: 1.5, fontSize: '0.75rem' }}
          >
            Accept
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<IonIcon name="close-outline" sx={{ fontSize: 14 }} />}
            onClick={() => onRespond(req.id, false)}
            disabled={responding === req.id + '_decline'}
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4, color: 'text.secondary', fontSize: '0.75rem' }}
          >
            Ignore
          </Button>
        </Box>
      </Box>
      <Divider />
    </>
  );
}

// ─── Suggestion / search result card (right column) ───────────────────────────

function SuggestCard({ user, onConnect, connecting }) {
  const status = user.connection_status;
  return (
    <Card variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            component={Link}
            to={profilePath(user)}
            src={user.avatar_url || undefined}
            sx={{ width: 44, height: 44, fontWeight: 700, textDecoration: 'none', flexShrink: 0, bgcolor: 'secondary.dark', fontSize: '1rem' }}
          >
            {user.name?.charAt(0) || '?'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component={Link}
              to={profilePath(user)}
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
            >
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ textTransform: 'capitalize' }}>
              {user.role}{user.company ? ` · ${user.company}` : ''}
            </Typography>
            {user.mc_number && (
              <Typography variant="caption" color="text.disabled" display="block">MC-{user.mc_number}</Typography>
            )}
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            {status === 'accepted' ? (
              <Chip label="Connected" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            ) : status === 'pending' ? (
              <Chip
                icon={<IonIcon name="time-outline" sx={{ fontSize: '13px !important' }} />}
                label="Pending"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ) : (
              <Button
                variant="outlined"
                size="small"
                startIcon={<IonIcon name="person-add-outline" sx={{ fontSize: 14 }} />}
                onClick={() => onConnect(user)}
                disabled={connecting === user.user_id}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 4, fontSize: '0.75rem', px: 1.5, whiteSpace: 'nowrap' }}
              >
                Connect
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Network() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
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
  const [stateFilter, setStateFilter] = useState(null);
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

  // Debounced search
  const runSearch = useCallback((q, state) => {
    if (!q && !state) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    networkApi.search(q, state)
      .then(res => setSearchResults(Array.isArray(res) ? res : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, stateFilter), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, stateFilter, runSearch]);

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

  const handleConnect = (targetUser) => {
    setConnecting(targetUser.user_id);
    networkApi.add(targetUser.user_id)
      .then(() => {
        // Update status in both suggestions and search results
        const patch = list => list.map(u =>
          u.user_id === targetUser.user_id ? { ...u, connection_status: 'pending' } : u
        );
        setSuggestions(patch);
        setSearchResults(patch);
      })
      .catch(err => alert(err.message || 'Failed to send connection request'))
      .finally(() => setConnecting(null));
  };

  // Filter connections by search query (client-side for left column)
  const filteredConnections = query
    ? connections.filter(c => {
        const q = query.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.mc_number?.toLowerCase().includes(q)
        );
      })
    : connections;

  const isSearchActive = Boolean(query || stateFilter);
  const rightColumnItems = isSearchActive
    ? searchResults.filter(u => u.connection_status !== 'accepted')
    : suggestions;

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 680, mx: 'auto' }}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
      ))}
    </Box>
  );

  // ── Shared search bar ────────────────────────────────────────────────────────
  const SearchBar = (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, company, or MC number…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IonIcon name="search-outline" sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: searching ? (
              <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
            ) : null,
          }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <Autocomplete
          options={US_STATES}
          value={stateFilter}
          onChange={(_, val) => setStateFilter(val)}
          size="small"
          sx={{ minWidth: 120 }}
          renderInput={params => <TextField {...params} label="State" />}
          clearOnEscape
        />
        {isSearchActive && (
          <Button
            variant="text"
            size="small"
            onClick={() => { setQuery(''); setStateFilter(null); }}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>

      {/* ── TAB: CONNECTIONS ── */}
      {activeTab === 'connections' && (
        <Box>
          {SearchBar}

          {/* Pending requests */}
          {pending.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <IonIcon name="time-outline" sx={{ color: 'warning.main', fontSize: 18 }} />
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
                />
              ))}
            </Box>
          )}

          {/* Connections list */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Connections</Typography>
            <Typography variant="body2" color="text.secondary">· {filteredConnections.length}</Typography>
            {isSearchActive && query && connections.length !== filteredConnections.length && (
              <Typography variant="caption" color="text.disabled">
                (filtered from {connections.length})
              </Typography>
            )}
          </Box>
          <Divider />
          {filteredConnections.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <IonIcon name="people-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {isSearchActive ? 'No connections match your search' : 'No connections yet'}
              </Typography>
              {!isSearchActive && (
                <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                  Switch to "People You May Know" to find carriers and brokers to connect with
                </Typography>
              )}
            </Box>
          ) : (
            filteredConnections.map(conn => (
              <ConnectionRow
                key={conn.id}
                conn={conn}
                onRemove={handleRemove}
                userRole={user?.role}
              />
            ))
          )}
        </Box>
      )}

      {/* ── TAB: PEOPLE YOU MAY KNOW ── */}
      {activeTab === 'know' && (
        <Box>
          {SearchBar}

          {searching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : rightColumnItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <IonIcon name="search-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {isSearchActive ? 'No results found' : 'No suggestions right now'}
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                {isSearchActive
                  ? 'Try a different name, company, or MC number'
                  : 'Check back after more users join the platform'}
              </Typography>
            </Box>
          ) : (
            rightColumnItems.map(u => (
              <SuggestCard
                key={u.user_id}
                user={u}
                onConnect={handleConnect}
                connecting={connecting}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
