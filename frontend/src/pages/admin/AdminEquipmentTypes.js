import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Skeleton, Paper, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { equipmentTypesApi } from '../../services/api';

function TypeDialog({ open, type, onClose, onSaved }) {
  const editing = Boolean(type?.id);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setName(type?.name || '');
      setSortOrder(type?.sort_order ?? 0);
      setError(null);
    }
  }, [open, type]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), sort_order: Number(sortOrder) || 0 };
      if (editing) {
        await equipmentTypesApi.adminUpdate(type.id, payload);
      } else {
        await equipmentTypesApi.adminCreate(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'Edit Equipment Type' : 'New Equipment Type'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth size="small" required
            placeholder="e.g. Dry Van"
          />
          <TextField
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            size="small"
            helperText="Lower = listed first"
            inputProps={{ min: 0 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminEquipmentTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    equipmentTypesApi.adminList()
      .then(setTypes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (type) => { setEditingType(type); setDialogOpen(true); };
  const handleNew  = ()      => { setEditingType(null); setDialogOpen(true); };

  const handleDelete = async (type) => {
    if (!window.confirm(`Delete "${type.name}"? This cannot be undone.`)) return;
    try {
      await equipmentTypesApi.adminDelete(type.id);
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const handleToggle = async (type) => {
    try {
      await equipmentTypesApi.adminUpdate(type.id, { is_active: !type.is_active });
      load();
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Equipment Types</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage equipment types used across truck postings and load postings
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          Add Type
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : types.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <LocalShippingIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography>No equipment types yet.</Typography>
            <Button onClick={handleNew} startIcon={<AddIcon />} sx={{ mt: 2 }}>Add First Type</Button>
          </Box>
        ) : (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: 80, textTransform: 'uppercase', letterSpacing: 0.5 }}>Order</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: 80, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</Typography>
              <Box sx={{ width: 80 }} />
            </Box>
            {types.map((type, i) => (
              <Box
                key={type.id}
                sx={{
                  display: 'flex', alignItems: 'center', px: 2.5, py: 1.5,
                  borderBottom: i < types.length - 1 ? 1 : 0, borderColor: 'divider',
                  opacity: type.is_active ? 1 : 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocalShippingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={600}>{type.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ width: 80 }}>{type.sort_order}</Typography>
                <Box sx={{ width: 80 }}>
                  <Chip
                    label={type.is_active ? 'Active' : 'Hidden'}
                    size="small"
                    color={type.is_active ? 'success' : 'default'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
                <Box sx={{ width: 80, display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <Tooltip title={type.is_active ? 'Hide' : 'Show'}>
                    <Switch size="small" checked={type.is_active} onChange={() => handleToggle(type)} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(type)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(type)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <TypeDialog
        open={dialogOpen}
        type={editingType}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />
    </Box>
  );
}
