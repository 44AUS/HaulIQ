import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Chip, CircularProgress, IconButton, Tooltip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Alert, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { truckPostsApi, equipmentTypesApi } from '../../services/api';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',      label: 'ALL' },
  { key: 'active',   label: 'ACTIVE' },
  { key: 'expired',  label: 'EXPIRED' },
  { key: 'inactive', label: 'INACTIVE' },
];

const STATUS_CHIP = {
  active:   { label: 'Active',   bg: '#2dd36f', text: '#fff' },
  expired:  { label: 'Expired',  bg: '#eb445a', text: '#fff' },
  inactive: { label: 'Inactive', bg: '#757575', text: '#fff' },
};

const STATUS_BAR = {
  active:   '#2dd36f',
  expired:  '#eb445a',
  inactive: '#616161',
};

function deriveStatus(post) {
  if (!post.is_active) return 'inactive';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const to = post.available_to ? new Date(post.available_to + 'T00:00:00') : null;
  if (to && to < today) return 'expired';
  return 'active';
}

const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const emptyForm = (equipmentTypes) => ({
  equipment_type: equipmentTypes[0]?.name || '',
  trailer_length: '',
  weight_capacity: '',
  current_location: '',
  preferred_origin: '',
  preferred_destination: '',
  available_from: '',
  available_to: '',
  rate_expectation: '',
  notes: '',
});

export default function Equipment() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [posts,          setPosts]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [spinning,       setSpinning]       = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [activeTab,      setActiveTab]      = useState('all');
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [editPost,       setEditPost]       = useState(null);
  const [isRepost,       setIsRepost]       = useState(false);
  const [form,           setForm]           = useState({});
  const [saving,         setSaving]         = useState(false);
  const [deleteId,       setDeleteId]       = useState(null);
  const [error,          setError]          = useState('');

  const fetchPosts = useCallback((spinner = false) => {
    if (spinner) setSpinning(true); else setLoading(true);
    truckPostsApi.mine()
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => { setLoading(false); setSpinning(false); });
  }, []);

  useEffect(() => {
    equipmentTypesApi.list().then(d => setEquipmentTypes(Array.isArray(d) ? d : [])).catch(() => {});
    fetchPosts();
  }, [fetchPosts]);

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

  const openCreate = () => {
    setEditPost(null); setIsRepost(false);
    setForm(emptyForm(equipmentTypes)); setError(''); setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post); setIsRepost(false);
    setForm({
      equipment_type: post.equipment_type || equipmentTypes[0]?.name || '',
      trailer_length: post.trailer_length ?? '',
      weight_capacity: post.weight_capacity ?? '',
      current_location: post.current_location || '',
      preferred_origin: post.preferred_origin || '',
      preferred_destination: post.preferred_destination || '',
      available_from: post.available_from || '',
      available_to: post.available_to || '',
      rate_expectation: post.rate_expectation ?? '',
      notes: post.notes || '',
    });
    setError(''); setDialogOpen(true);
  };

  const openRepost = (post) => {
    setEditPost(null); setIsRepost(true);
    setForm({
      equipment_type: post.equipment_type || equipmentTypes[0]?.name || '',
      trailer_length: post.trailer_length ?? '',
      weight_capacity: post.weight_capacity ?? '',
      current_location: post.current_location || '',
      preferred_origin: post.preferred_origin || '',
      preferred_destination: post.preferred_destination || '',
      available_from: '', available_to: '',
      rate_expectation: post.rate_expectation ?? '',
      notes: post.notes || '',
    });
    setError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.equipment_type || !form.current_location || !form.available_from || !form.available_to) {
      setError('Equipment type, current location, and availability dates are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const body = {
        equipment_type:        form.equipment_type,
        current_location:      form.current_location,
        available_from:        form.available_from,
        available_to:          form.available_to,
        trailer_length:        form.trailer_length    ? parseInt(form.trailer_length, 10)    : null,
        weight_capacity:       form.weight_capacity   ? parseInt(form.weight_capacity, 10)   : null,
        preferred_origin:      form.preferred_origin  || null,
        preferred_destination: form.preferred_destination || null,
        rate_expectation:      form.rate_expectation  ? parseFloat(form.rate_expectation)    : null,
        notes:                 form.notes             || null,
      };
      if (editPost) await truckPostsApi.update(editPost.id, body);
      else          await truckPostsApi.create(body);
      setDialogOpen(false);
      fetchPosts(true);
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (e, post) => {
    e.stopPropagation();
    try { await truckPostsApi.update(post.id, { is_active: !post.is_active }); fetchPosts(true); } catch (_) {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await truckPostsApi.remove(deleteId); setDeleteId(null); fetchPosts(true); } catch (_) {}
  };

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const activeFg   = isDark ? '#fff' : '#000';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '4px 6px' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: 'background.paper', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, flexShrink: 0 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>My Equipment</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Post your available trucks so brokers can find and contact you.
          </Typography>
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
            <IconButton size="small" onClick={() => fetchPosts(true)} sx={{ color: 'text.secondary' }}>
              <RefreshIcon sx={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1.5 }}>
            <LocalShippingIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">No trucks in this category.</Typography>
            {activeTab === 'all' && (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} size="small">
                Post Your First Truck
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: '400 !important', color: `${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)'} !important` } }}>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 150 }}>Equipment</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 160 }}>Location</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 200 }}>Available</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 160 }}>Preferred Lane</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 100 }}>Rate Exp.</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, width: 110, minWidth: 110 }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', py: 1.25, width: 110, minWidth: 110 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {tabItems.map((post) => {
                  const chip     = STATUS_CHIP[post._status] || { label: post._status, bg: '#9e9e9e', text: '#fff' };
                  const barColor = STATUS_BAR[post._status]  || '#9e9e9e';
                  return (
                    <TableRow key={post.id} sx={{
                      height: 64,
                      '& td': { py: 0, borderBottom: 0 },
                      '& td:not(:nth-of-type(1))': { borderBottom: '1px solid', borderBottomColor: 'divider' },
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                    }}>
                      {/* Equipment — accent bar */}
                      <TableCell sx={{ pl: 0, position: 'relative', minWidth: 150 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, bgcolor: barColor, borderRadius: '0 2px 2px 0' }} />
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{post.equipment_type}</Typography>
                          {(post.trailer_length || post.weight_capacity) && (
                            <Typography variant="caption" color="text.disabled" display="block">
                              {[post.trailer_length && `${post.trailer_length} ft`, post.weight_capacity && `${Number(post.weight_capacity).toLocaleString()} lbs`].filter(Boolean).join(' · ')}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography variant="body2" noWrap>{post.current_location || '—'}</Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(post.available_from)} — {fmtDate(post.available_to)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
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
                        <Tooltip title={post.is_active ? 'Click to deactivate' : 'Click to activate'}>
                          <Chip
                            label={chip.label}
                            size="small"
                            onClick={e => handleToggleActive(e, post)}
                            sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600, borderRadius: '8px', bgcolor: chip.bg, color: chip.text, cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ width: 110, minWidth: 110, pr: 1 }} onClick={e => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <Tooltip title="Repost with new dates">
                            <IconButton size="small" onClick={() => openRepost(post)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' }, p: 0.5 }}>
                              <ReplayIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(post)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' }, p: 0.5 }}>
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteId(post.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, p: 0.5 }}>
                              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* ── Post Truck button ── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5, flexShrink: 0 }}>
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 17 }} />} onClick={openCreate}
          sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, fontWeight: 700, px: 2.5, py: 0.9, borderRadius: '8px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 16px rgba(0,0,0,0.22)' }}>
          Post Truck
        </Button>
      </Box>

    </Box>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>

    {/* ── Create / Edit / Repost Dialog ── */}
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle fontWeight={700}>
        {isRepost ? 'Repost Truck — Update Dates' : editPost ? 'Edit Truck Posting' : 'Post a Truck'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {isRepost && <Alert severity="info">Same equipment and specs pre-filled — just update your availability dates.</Alert>}

          <FormControl fullWidth size="small">
            <InputLabel>Equipment Type *</InputLabel>
            <Select value={form.equipment_type || ''} label="Equipment Type *" onChange={setField('equipment_type')}>
              {equipmentTypes.map(t => <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Trailer Length (ft)" type="number" size="small" fullWidth value={form.trailer_length} onChange={setField('trailer_length')} inputProps={{ min: 0 }} />
            <TextField label="Weight Capacity (lbs)" type="number" size="small" fullWidth value={form.weight_capacity} onChange={setField('weight_capacity')} inputProps={{ min: 0 }} />
          </Box>

          <AddressAutocomplete
            label="Current Location *"
            placeholder="e.g. Dallas, TX"
            value={form.current_location}
            onChange={({ cityState, address }) => setForm(f => ({ ...f, current_location: cityState || address || '' }))}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Preferred Origin" size="small" fullWidth value={form.preferred_origin} onChange={setField('preferred_origin')} />
            <TextField label="Preferred Destination" size="small" fullWidth value={form.preferred_destination} onChange={setField('preferred_destination')} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Available From *" type="date" size="small" fullWidth required value={form.available_from} onChange={setField('available_from')} InputLabelProps={{ shrink: true }} />
            <TextField label="Available To *" type="date" size="small" fullWidth required value={form.available_to} onChange={setField('available_to')} InputLabelProps={{ shrink: true }} />
          </Box>

          <TextField label="Rate Expectation ($/mile)" type="number" size="small" fullWidth value={form.rate_expectation} onChange={setField('rate_expectation')} inputProps={{ min: 0, step: 0.01 }} placeholder="Optional" />
          <TextField label="Notes" multiline minRows={3} size="small" fullWidth value={form.notes} onChange={setField('notes')} placeholder="Any additional details..." />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontWeight: 700 }}>
          {saving ? 'Saving…' : isRepost ? 'Repost Truck' : editPost ? 'Save Changes' : 'Post Truck'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* ── Delete Confirm ── */}
    <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle fontWeight={700}>Delete Truck Posting?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          This will permanently remove this truck posting. Brokers will no longer be able to find it.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDeleteId(null)}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 700 }}>Delete</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
