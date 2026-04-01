import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Chip, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { truckPostsApi } from '../../services/api';

const EQUIPMENT_OPTIONS = [
  { value: 'dry_van',    label: 'Dry Van',    color: 'default' },
  { value: 'flatbed',    label: 'Flatbed',    color: 'warning' },
  { value: 'reefer',     label: 'Reefer',     color: 'info' },
  { value: 'step_deck',  label: 'Step Deck',  color: 'secondary' },
  { value: 'lowboy',     label: 'Lowboy',     color: 'error' },
  { value: 'power_only', label: 'Power Only', color: 'success' },
];

const EMPTY_FORM = {
  equipment_type: 'dry_van',
  trailer_length: '',
  weight_capacity: '',
  current_location: '',
  preferred_origin: '',
  preferred_destination: '',
  available_from: '',
  available_to: '',
  rate_expectation: '',
  notes: '',
};

function equipmentLabel(value) {
  return EQUIPMENT_OPTIONS.find(o => o.value === value)?.label || value;
}

function equipmentColor(value) {
  return EQUIPMENT_OPTIONS.find(o => o.value === value)?.color || 'default';
}

export default function Equipment() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
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

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openCreate = () => {
    setEditPost(null);
    setForm(EMPTY_FORM);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setForm({
      equipment_type: post.equipment_type || 'dry_van',
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          Post Truck
        </Button>
      </Box>

      {/* Cards */}
      {loading ? (
        <Typography color="text.secondary">Loading your equipment...</Typography>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalShippingIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} color="text.secondary">No trucks posted yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5, mb: 3 }}>
            Post your available capacity so brokers can reach out.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Post Your First Truck
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {posts.map(post => (
            <Card
              key={post.id}
              variant="outlined"
              sx={{
                flex: '1 1 340px',
                minWidth: 0,
                borderRadius: 2,
                opacity: post.is_active ? 1 : 0.6,
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: 3 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                {/* Top row: chip + actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                  <Chip
                    label={equipmentLabel(post.equipment_type)}
                    color={equipmentColor(post.equipment_type)}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={post.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={post.is_active ? 'success' : 'default'}
                      variant="outlined"
                      onClick={() => handleToggleActive(post)}
                      sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}
                    />
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

                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={600}>{post.current_location}</Typography>
                </Box>

                {/* Dates */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <CalendarTodayIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {post.available_from} — {post.available_to}
                  </Typography>
                </Box>

                {/* Rate */}
                {post.rate_expectation != null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <AttachMoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      ${post.rate_expectation.toFixed(2)}/mile
                    </Typography>
                  </Box>
                )}

                {/* Preferred lanes */}
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

                {/* Specs */}
                {(post.trailer_length || post.weight_capacity) && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    {post.trailer_length && (
                      <Typography variant="caption" color="text.secondary">{post.trailer_length} ft</Typography>
                    )}
                    {post.weight_capacity && (
                      <Typography variant="caption" color="text.secondary">{post.weight_capacity.toLocaleString()} lbs</Typography>
                    )}
                  </Box>
                )}

                {/* Notes */}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editPost ? 'Edit Truck Posting' : 'Post a Truck'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Typography variant="body2" color="error">{error}</Typography>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Equipment Type</InputLabel>
              <Select
                value={form.equipment_type}
                label="Equipment Type"
                onChange={setField('equipment_type')}
              >
                {EQUIPMENT_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Trailer Length (ft)"
                type="number"
                size="small"
                fullWidth
                value={form.trailer_length}
                onChange={setField('trailer_length')}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Weight Capacity (lbs)"
                type="number"
                size="small"
                fullWidth
                value={form.weight_capacity}
                onChange={setField('weight_capacity')}
                inputProps={{ min: 0 }}
              />
            </Box>

            <TextField
              label="Current Location"
              placeholder="e.g. Dallas, TX"
              size="small"
              fullWidth
              required
              value={form.current_location}
              onChange={setField('current_location')}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Preferred Origin (optional)"
                placeholder="e.g. TX"
                size="small"
                fullWidth
                value={form.preferred_origin}
                onChange={setField('preferred_origin')}
              />
              <TextField
                label="Preferred Destination (optional)"
                placeholder="e.g. CA"
                size="small"
                fullWidth
                value={form.preferred_destination}
                onChange={setField('preferred_destination')}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Available From"
                type="date"
                size="small"
                fullWidth
                required
                value={form.available_from}
                onChange={setField('available_from')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Available To"
                type="date"
                size="small"
                fullWidth
                required
                value={form.available_to}
                onChange={setField('available_to')}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              label="Rate Expectation ($/mile)"
              type="number"
              size="small"
              fullWidth
              value={form.rate_expectation}
              onChange={setField('rate_expectation')}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="Optional"
            />

            <TextField
              label="Notes"
              multiline
              minRows={3}
              size="small"
              fullWidth
              value={form.notes}
              onChange={setField('notes')}
              placeholder="Any additional details about your truck or preferences..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {saving ? 'Saving…' : editPost ? 'Save Changes' : 'Post Truck'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Truck Posting?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove this truck posting. Brokers will no longer be able to find it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
