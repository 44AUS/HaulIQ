import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, useTheme,
} from '@mui/material';
import { truckPostsApi, equipmentTypesApi, messagesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


const TABS = [
  { key: 'all',       label: 'ALL' },
  { key: 'available', label: 'AVAILABLE' },
  { key: 'expired',   label: 'EXPIRED' },
  { key: 'inactive',  label: 'INACTIVE' },
];

const STATUS_CHIP = {
  available: { label: 'Available', bg: '#2dd36f', text: '#fff' },
  expired:   { label: 'Expired',   bg: '#eb445a', text: '#fff' },
  inactive:  { label: 'Inactive',  bg: '#757575', text: '#fff' },
};

const STATUS_BAR = {
  available: '#2dd36f',
  expired:   '#eb445a',
  inactive:  '#616161',
};

function deriveStatus(post) {
  if (!post.is_active) return 'inactive';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const to = post.available_to ? new Date(post.available_to + 'T00:00:00') : null;
  if (to && to < today) return 'expired';
  return 'available';
}

const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TruckBoard() {
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isDark    = theme.palette.mode === 'dark';

  const [posts,           setPosts]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [spinning,        setSpinning]        = useState(false);
  const [equipmentTypes,  setEquipmentTypes]  = useState([]);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [locationSearch,  setLocationSearch]  = useState('');
  const [activeTab,       setActiveTab]       = useState('all');
  const debounceRef = useRef(null);

  useEffect(() => {
    equipmentTypesApi.list()
      .then(d => setEquipmentTypes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback((eqType, loc, spinner = false) => {
    if (spinner) setSpinning(true); else setLoading(true);
    const params = {};
    if (eqType) params.equipment_type = eqType;
    if (loc?.trim()) params.location = loc.trim();
    truckPostsApi.list(params)
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => { setLoading(false); setSpinning(false); });
  }, []);

  useEffect(() => { fetchPosts(equipmentFilter, locationSearch); }, [equipmentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPosts(equipmentFilter, val), 400);
  };

  const handleContact = async (e, post) => {
    e.stopPropagation();
    try {
      const convo = await messagesApi.direct(post.carrier_id);
      navigate(`/broker/messages?conv=${convo.id}`);
    } catch { navigate('/broker/messages'); }
  };

  const enriched = useMemo(() => posts.map(p => ({ ...p, _status: deriveStatus(p) })), [posts]);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return enriched;
    return enriched.filter(p => p._status === activeTab);
  }, [enriched, activeTab]);

  const tabCounts = useMemo(() => {
    const c = { all: enriched.length };
    TABS.slice(1).forEach(t => { c[t.key] = enriched.filter(p => p._status === t.key).length; });
    return c;
  }, [enriched]);

  const activeFg   = isDark ? '#fff' : '#000';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '4px 6px' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: 'background.paper', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 3, py: 1.5, flexShrink: 0, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Available Trucks</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Browse carrier capacity and reach out directly.
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search location…"
            size="small"
            value={locationSearch}
            onChange={handleLocationChange}
            sx={{ width: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IonIcon name="search-outline" sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
              sx: { fontSize: '0.82rem' },
            }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              label="All"
              size="small"
              onClick={() => setEquipmentFilter('')}
              variant={equipmentFilter === '' ? 'filled' : 'outlined'}
              color={equipmentFilter === '' ? 'primary' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
            />
            {equipmentTypes.map(t => (
              <Chip
                key={t.id}
                label={t.name}
                size="small"
                onClick={() => setEquipmentFilter(t.name)}
                variant={equipmentFilter === t.name ? 'filled' : 'outlined'}
                color={equipmentFilter === t.name ? 'primary' : 'default'}
                sx={{ fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Tab bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'stretch', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count    = tabCounts[tab.key] ?? 0;
          return (
            <Box key={tab.key} onClick={() => setActiveTab(tab.key)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2.75, cursor: 'pointer', flexShrink: 0,
                borderBottom: isActive ? '2px solid' : '2px solid transparent',
                borderColor: isActive ? (isDark ? '#fff' : '#000') : 'transparent',
                color: isActive ? activeFg : inactiveFg,
                opacity: isActive ? 1 : 0.6,
                '&:hover': { opacity: 1, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                transition: 'opacity 0.15s, background-color 0.15s',
              }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</Typography>
              <Box sx={{ bgcolor: 'background.default', borderRadius: '4px', px: 0.6, py: 0.15, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{count}</Typography>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => fetchPosts(equipmentFilter, locationSearch, true)} sx={{ color: 'text.secondary' }}>
              <IonIcon name="refresh-outline" sx={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Table ── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={28} />
          </Box>
        ) : tabItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1 }}>
            <IonIcon name="car-sport-outline" sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              {equipmentFilter || locationSearch ? 'No trucks match your filters.' : 'No trucks in this category.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: '400 !important', color: `${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)'} !important` } }}>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 180 }}>Carrier</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 140 }}>Equipment</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 160 }}>Location</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 180 }}>Available</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 120 }}>Preferred Lane</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 100 }}>Rate Exp.</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, width: 110, minWidth: 110 }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', py: 1.25, width: 48, minWidth: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {tabItems.map((post) => {
                  const chip     = STATUS_CHIP[post._status] || { label: post._status, bg: '#9e9e9e', text: '#fff' };
                  const barColor = STATUS_BAR[post._status] || '#9e9e9e';
                  return (
                    <TableRow
                      key={post.id}
                      sx={{
                        height: 64,
                        cursor: 'default',
                        '& td': { py: 0, borderBottom: 0 },
                        '& td:not(:nth-of-type(1))': { borderBottom: '1px solid', borderBottomColor: 'divider' },
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                      }}
                    >
                      {/* Carrier — accent bar */}
                      <TableCell sx={{ pl: 0, position: 'relative', minWidth: 180 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, bgcolor: barColor, borderRadius: '0 2px 2px 0' }} />
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{post.carrier_name || 'Carrier'}</Typography>
                          {post.carrier_company && (
                            <Typography variant="caption" color="text.secondary" noWrap display="block">{post.carrier_company}</Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>{post.equipment_type}</Typography>
                        {(post.trailer_length || post.weight_capacity) && (
                          <Typography variant="caption" color="text.disabled" display="block">
                            {[post.trailer_length && `${post.trailer_length} ft`, post.weight_capacity && `${post.weight_capacity.toLocaleString()} lbs`].filter(Boolean).join(' · ')}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography variant="body2" noWrap>{post.current_location || '—'}</Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(post.available_from)} — {fmtDate(post.available_to)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 120 }}>
                        {post.preferred_origin || post.preferred_destination ? (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {[post.preferred_origin, post.preferred_destination].filter(Boolean).join(' → ')}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ minWidth: 100 }}>
                        <Typography variant="body2" fontWeight={600} color={post.rate_expectation ? 'success.main' : 'text.disabled'}>
                          {post.rate_expectation ? `$${post.rate_expectation.toFixed(2)}/mi` : 'Negotiable'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ width: 110, minWidth: 110 }}>
                        <Chip label={chip.label} size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600, borderRadius: '8px', bgcolor: chip.bg, color: chip.text }} />
                      </TableCell>

                      <TableCell sx={{ width: 48, minWidth: 48, pr: 1 }} onClick={e => e.stopPropagation()}>
                        <Tooltip title="Contact carrier">
                          <IconButton size="small" onClick={e => handleContact(e, post)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' }, p: 0.5 }}>
                            <IonIcon name="chatbubble-outline" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

    </Box>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
