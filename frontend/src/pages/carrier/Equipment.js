import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Chip, IconButton, Tooltip, Skeleton, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { truckPostsApi, equipmentTypesApi } from '../../services/api';

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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [isRepost, setIsRepost] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(() => {
    setLoading(true);
    truckPostsApi.mine()
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    equipmentTypesApi.list().then(data => setEquipmentTypes(Array.isArray(data) ? data : [])).catch(() => {});
    fetchPosts();
  }, [fetchPosts]);

  const openCreate = () => {
    setEditPost(null);
    setIsRepost(false);
    setForm(emptyForm(equipmentTypes));
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setIsRepost(false);
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
    setError('');
    setDialogOpen(true);
  };

  // Repost: same equipment/location/specs, just clear dates so carrier sets new availability
  const openRepost = (post) => {
    setEditPost(null);
    setIsRepost(true);
    setForm({
      equipment_type: post.equipment_type || equipmentTypes[0]?.name || '',
      trailer_length: post.trailer_length ?? '',
      weight_capacity: post.weight_capacity ?? '',
      current_location: post.current_location || '',
      preferred_origin: post.preferred_origin || '',
      preferred_destination: post.preferred_destination || '',
      available_from: '',
      available_to: '',
      rate_expectation: post.rate_expectation ?? '',
      notes: post.notes || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.equipment_type || !form.current_location || !form.available_from || !form.available_to) {
      setError('Equipment type, current location, and availability dates are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        equipment_type: form.equipment_type,
        current_location: form.current_location,
        available_from: form.available_from,
        available_to: form.available_to,
        trailer_length: form.trailer_length ? parseInt(form.trailer_length, 10) : null,
        weight_capacity: form.weight_capacity ? parseInt(form.weight_capacity, 10) : null,
        preferred_origin: form.preferred_origin || null,
        preferred_destination: form.preferred_destination || null,
        rate_expectation: form.rate_expectation ? parseFloat(form.rate_expectation) : null,
        notes: form.notes || null,
      };
      if (editPost) {
        await truckPostsApi.update(editPost.id, body);
      } else {
        await truckPostsApi.create(body);
      }
      setDialogOpen(false);
      fetchPosts();
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (post) => {
    try {
      await truckPostsApi.update(post.id, { is_active: !post.is_active });
      fetchPosts();
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await truckPostsApi.remove(deleteId);
      setDeleteId(null);
      fetchPosts();
    } catch (_) {}
  };

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Equipment & Availability</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Post your available trucks so brokers can find and contact you directly.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Post Truck
        </Button>
      </Box>

      {/* Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[1, 2, 3].map(i => (
            <Box key={i} sx={{ flex: '1 1 340px', minWidth: 0 }}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalShippingIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} color="text.secondary">No trucks posted yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5, mb: 3 }}>
            Post your available capacity so brokers can reach out.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
            Post Your First Truck
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {posts.map(post => (
            <Card
              key={post.id}
              variant="outlined"
              sx={{ flex: '1 1 340px', minWidth: 0, borderRadius: 2, opacity: post.is_active ? 1 : 0.6, '&:hover': { boxShadow: 3 } }}
            >
              <CardContent sx={{ p: 2.5 }}>
                {/* Top row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                  <Chip label={post.equipment_type} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={post.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={post.is_active ? 'success' : 'default'}
                      variant="outlined"
                      onClick={() => handleToggleActive(post)}
                      sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                    <Tooltip title="Repost with new dates">
                      <IconButton size="small" onClick={() => openRepost(post)} color="primary">
                        <ReplayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(post)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteId(post.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={600}>{post.current_location}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <CalendarTodayIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {post.available_from} — {post.available_to}
                  </Typography>
                </Box>

                {post.rate_expectation != null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <AttachMoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      ${post.rate_expectation.toFixed(2)}/mile
                    </Typography>
                  </Box>
                )}

                {(post.preferred_origin || post.preferred_destination) && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Preferred Lane
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {[post.preferred_origin, post.preferred_destination].filter(Boolean).join(' → ')}
                    </Typography>
                  </Box>
                )}

                {(post.trailer_length || post.weight_capacity) && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    {post.trailer_length && <Typography variant="caption" color="text.secondary">{post.trailer_length} ft</Typography>}
                    {post.weight_capacity && <Typography variant="caption" color="text.secondary">{post.weight_capacity.toLocaleString()} lbs</Typography>}
                  </Box>
                )}

                {post.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                    {post.notes.length > 80 ? post.notes.slice(0, 80) + '…' : post.notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create / Edit / Repost Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {isRepost ? 'Repost Truck — Update Dates' : editPost ? 'Edit Truck Posting' : 'Post a Truck'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {isRepost && (
              <Alert severity="info">
                Same equipment and specs pre-filled — just update your availability dates.
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Equipment Type *</InputLabel>
              <Select value={form.equipment_type || ''} label="Equipment Type *" onChange={setField('equipment_type')}>
                {equipmentTypes.map(t => (
                  <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>
                ))}
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
              <TextField label="Preferred Origin (optional)" placeholder="e.g. Texas" size="small" fullWidth value={form.preferred_origin} onChange={setField('preferred_origin')} />
              <TextField label="Preferred Destination (optional)" placeholder="e.g. California" size="small" fullWidth value={form.preferred_destination} onChange={setField('preferred_destination')} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Available From *" type="date" size="small" fullWidth required value={form.available_from} onChange={setField('available_from')} InputLabelProps={{ shrink: true }} />
              <TextField label="Available To *" type="date" size="small" fullWidth required value={form.available_to} onChange={setField('available_to')} InputLabelProps={{ shrink: true }} />
            </Box>

            <TextField label="Rate Expectation ($/mile)" type="number" size="small" fullWidth value={form.rate_expectation} onChange={setField('rate_expectation')} inputProps={{ min: 0, step: 0.01 }} placeholder="Optional" />

            <TextField label="Notes" multiline minRows={3} size="small" fullWidth value={form.notes} onChange={setField('notes')} placeholder="Any additional details about your truck or preferences..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isRepost ? 'Repost Truck' : editPost ? 'Save Changes' : 'Post Truck'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Truck Posting?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove this truck posting. Brokers will no longer be able to find it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
