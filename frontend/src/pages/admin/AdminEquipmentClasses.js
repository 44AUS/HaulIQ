import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Skeleton, Paper, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { equipmentClassesApi } from '../../services/api';

function ClassDialog({ open, cls, onClose, onSaved }) {
  const editing = Boolean(cls?.id);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setName(cls?.name || '');
      setError(null);
    }
  }, [open, cls]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim() };
      if (editing) {
        await equipmentClassesApi.adminUpdate(cls.id, payload);
      } else {
        await equipmentClassesApi.adminCreate(payload);
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
      <DialogTitle fontWeight={700}>{editing ? 'Edit Equipment Class' : 'New Equipment Class'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Class Name"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth size="small" required
            placeholder="e.g. Flatbed, Dry Van, Refrigerated"
            helperText="Groups related equipment types so users can search by class"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Class'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminEquipmentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    equipmentClassesApi.adminList()
      .then(setClasses)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (cls) => { setEditingClass(cls); setDialogOpen(true); };
  const handleNew  = ()    => { setEditingClass(null); setDialogOpen(true); };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete "${cls.name}"? Equipment types in this class will be unassigned.`)) return;
    try {
      await equipmentClassesApi.adminDelete(cls.id);
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const handleToggle = async (cls) => {
    try {
      await equipmentClassesApi.adminUpdate(cls.id, { is_active: !cls.is_active });
      load();
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Equipment Classes</Typography>
          <Typography variant="body2" color="text.secondary">
            Group equipment types into searchable classes (e.g. Flatbed, Refrigerated)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          Add Class
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={72} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : classes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <CategoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography>No equipment classes yet.</Typography>
            <Button onClick={handleNew} startIcon={<AddIcon />} sx={{ mt: 2 }}>Add First Class</Button>
          </Box>
        ) : (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Class Name</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: 140, textTransform: 'uppercase', letterSpacing: 0.5 }}>Types</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ width: 80, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</Typography>
              <Box sx={{ width: 96 }} />
            </Box>

            {classes.map((cls, i) => (
              <Box
                key={cls.id}
                sx={{
                  display: 'flex', alignItems: 'center', px: 2.5, py: 1.5,
                  borderBottom: i < classes.length - 1 ? 1 : 0, borderColor: 'divider',
                  opacity: cls.is_active ? 1 : 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="body2" fontWeight={700}>{cls.name}</Typography>
                </Box>

                <Box sx={{ width: 140, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {cls.equipment_types?.length > 0 ? (
                    cls.equipment_types.slice(0, 3).map(t => (
                      <Chip
                        key={t.id}
                        icon={<LocalShippingIcon sx={{ fontSize: '12px !important' }} />}
                        label={t.abbreviation || t.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.disabled">No types</Typography>
                  )}
                  {cls.equipment_types?.length > 3 && (
                    <Typography variant="caption" color="text.secondary">+{cls.equipment_types.length - 3} more</Typography>
                  )}
                </Box>

                <Box sx={{ width: 80 }}>
                  <Chip
                    label={cls.is_active ? 'Active' : 'Hidden'}
                    size="small"
                    color={cls.is_active ? 'success' : 'default'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>

                <Box sx={{ width: 96, display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <Tooltip title={cls.is_active ? 'Hide' : 'Show'}>
                    <Switch size="small" checked={cls.is_active} onChange={() => handleToggle(cls)} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(cls)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(cls)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <ClassDialog
        open={dialogOpen}
        cls={editingClass}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />
    </Box>
  );
}
