import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Skeleton, Alert, Divider, Tooltip, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { plansApi } from '../../services/api';

const COLOR_OPTIONS = [
  { value: 'default', label: 'Default (grey)' },
  { value: 'brand',   label: 'Brand (blue/teal)' },
  { value: 'purple',  label: 'Purple' },
];

const TIER_OPTIONS = ['basic', 'pro', 'elite'];

const EMPTY_FORM = {
  name: '', role: 'carrier', tier: 'pro', price: '', description: '',
  features: '', missing: '', popular: false, color: 'brand', sort_order: 0,
};

function PlanDialog({ open, plan, onClose, onSaved }) {
  const editing = Boolean(plan?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (plan) {
        setForm({
          name: plan.name || '',
          role: plan.role || 'carrier',
          tier: plan.tier || 'pro',
          price: plan.price ?? '',
          description: plan.description || '',
          features: (plan.features || []).join('\n'),
          missing: (plan.limits?.missing || []).join('\n'),
          popular: plan.limits?.popular || false,
          color: plan.limits?.color || 'brand',
          sort_order: plan.limits?.sort_order ?? 0,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError(null);
    }
  }, [open, plan]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.price === '' || isNaN(Number(form.price))) { setError('Valid price is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        tier: form.tier,
        price: Number(form.price),
        description: form.description.trim(),
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
        limits: {
          missing: form.missing.split('\n').map(s => s.trim()).filter(Boolean),
          popular: form.popular,
          color: form.color,
          sort_order: Number(form.sort_order) || 0,
        },
      };
      if (editing) {
        await plansApi.adminUpdate(plan.id, payload);
      } else {
        await plansApi.adminCreate(payload);
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Plan' : 'New Plan'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Plan Name" value={form.name} onChange={e => set('name', e.target.value)} fullWidth required size="small" placeholder="e.g. Pro" />
            <TextField label="Price ($/mo)" type="number" value={form.price} onChange={e => set('price', e.target.value)} sx={{ width: 140 }} required size="small" inputProps={{ min: 0, step: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} onChange={e => set('role', e.target.value)} label="Role">
                <MenuItem value="carrier">Carrier</MenuItem>
                <MenuItem value="broker">Broker</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select value={form.tier} onChange={e => set('tier', e.target.value)} label="Tier">
                {TIER_OPTIONS.map(t => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 180 }}>
              <InputLabel>Color</InputLabel>
              <Select value={form.color} onChange={e => set('color', e.target.value)} label="Color">
                {COLOR_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Description" value={form.description} onChange={e => set('description', e.target.value)} fullWidth size="small" placeholder="Short description shown on pricing card" />
          <TextField
            label="Included Features (one per line)"
            value={form.features}
            onChange={e => set('features', e.target.value)}
            fullWidth multiline rows={5} size="small"
            placeholder={"Unlimited load views\nFull profit calculator\nPriority support"}
            helperText="Each line becomes a ✓ bullet on the pricing card"
          />
          <TextField
            label="Not Included Features (one per line)"
            value={form.missing}
            onChange={e => set('missing', e.target.value)}
            fullWidth multiline rows={3} size="small"
            placeholder={"Advanced AI insights\nEarly load access"}
            helperText="Each line becomes a ✗ struck-through bullet"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FormControlLabel control={<Switch checked={form.popular} onChange={e => set('popular', e.target.checked)} />} label="Mark as Most Popular" />
            <TextField label="Sort Order" type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} size="small" sx={{ width: 120 }} inputProps={{ min: 0 }} helperText="Lower = first" />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Plan'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function PlanCard({ plan, onEdit, onDelete, onToggle }) {
  const color = plan.limits?.color || 'default';
  const popular = plan.limits?.popular || false;
  const missing = plan.limits?.missing || [];
  const chipColor = color === 'brand' ? 'primary' : color === 'purple' ? 'secondary' : 'default';

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, opacity: plan.is_active ? 1 : 0.5, position: 'relative' }}>
      {popular && (
        <Chip label="Most Popular" color="primary" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem' }} />
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography fontWeight={700} fontSize="1.05rem">{plan.name}</Typography>
          <Typography variant="caption" color="text.secondary">{plan.description}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={plan.is_active ? 'Deactivate' : 'Activate'}><Switch size="small" checked={plan.is_active} onChange={() => onToggle(plan)} /></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(plan)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(plan)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1.5 }}>
        <Typography variant="h5" fontWeight={800}>${plan.price}</Typography>
        <Typography variant="body2" color="text.secondary">/mo</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <Chip label={plan.role} size="small" />
        <Chip label={plan.tier} size="small" />
        <Chip label={`Color: ${color}`} size="small" color={chipColor} variant="outlined" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {(plan.features || []).slice(0, 4).map(f => (
          <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 13, color: 'success.main', flexShrink: 0 }} />
            <Typography variant="caption" noWrap>{f}</Typography>
          </Box>
        ))}
        {(plan.features || []).length > 4 && (
          <Typography variant="caption" color="text.secondary">+{plan.features.length - 4} more features</Typography>
        )}
        {missing.slice(0, 2).map(f => (
          <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.45 }}>
            <DragIndicatorIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" noWrap sx={{ textDecoration: 'line-through' }}>{f}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [tab, setTab] = useState('carrier');

  const load = useCallback(() => {
    setLoading(true);
    plansApi.adminList()
      .then(setPlans)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (plan) => { setEditingPlan(plan); setDialogOpen(true); };
  const handleNew = () => { setEditingPlan(null); setDialogOpen(true); };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await plansApi.adminDelete(plan.id);
      load();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const handleToggle = async (plan) => {
    try {
      await plansApi.adminUpdate(plan.id, { is_active: !plan.is_active });
      load();
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  const filtered = plans.filter(p => p.role === tab).sort((a, b) => ((a.limits?.sort_order ?? 99) - (b.limits?.sort_order ?? 99)) || a.price - b.price);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Pricing Plans</Typography>
          <Typography variant="body2" color="text.secondary">Manage what appears on the landing page pricing section</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>New Plan</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {['carrier', 'broker'].map(t => (
          <Button key={t} variant={tab === t ? 'contained' : 'outlined'} size="small" onClick={() => setTab(t)} sx={{ textTransform: 'capitalize' }}>
            {t === 'carrier' ? '🚛 Carriers' : '📋 Brokers'} ({plans.filter(p => p.role === t).length})
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={280} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography>No {tab} plans yet.</Typography>
          <Button onClick={handleNew} startIcon={<AddIcon />} sx={{ mt: 2 }}>Create First Plan</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {filtered.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </Box>
      )}

      <PlanDialog
        open={dialogOpen}
        plan={editingPlan}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />
    </Box>
  );
}
