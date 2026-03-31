import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  List, ListItem, ListItemIcon, ListItemText, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Skeleton,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CircleIcon from '@mui/icons-material/Circle';
import { adminApi } from '../../services/api';

function EditModal({ plan, onClose, onSaved }) {
  const [price, setPrice] = useState(String(plan.price));
  const [description, setDescription] = useState(plan.description || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const params = {};
      const newPrice = parseFloat(price);
      if (!isNaN(newPrice) && newPrice !== plan.price) params.price = newPrice;
      if (description !== (plan.description || '')) params.description = description;
      if (Object.keys(params).length > 0) {
        const updated = await adminApi.updatePlan(plan.id, params);
        onSaved(updated);
      } else {
        onClose();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Edit Plan: {plan.name}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Monthly Price ($)"
            size="small"
            fullWidth
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          {plan.features?.length > 0 && (
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Features</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {plan.features.map((f, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon sx={{ fontSize: 13, color: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="body2">{f}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
        <Button variant="contained" onClick={handleSave} fullWidth disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PlanCard({ plan, onEdit }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderColor: plan.tier === 'elite' ? 'secondary.main' : plan.tier === 'pro' ? 'primary.main' : 'divider',
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                {plan.name}
              </Typography>
              {plan.tier === 'pro' && <Chip label="Popular" size="small" color="success" />}
            </Box>
            <Typography variant="caption" color="text.secondary">{plan.description || '—'}</Typography>
          </Box>
          <IconButton size="small" onClick={() => onEdit(plan)}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Typography variant="h4" fontWeight={800} mb={2}>
          {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
        </Typography>
        {plan.features?.length > 0 && (
          <List dense disablePadding sx={{ flex: 1, mb: 2 }}>
            {plan.features.slice(0, 4).map(f => (
              <ListItem key={f} disablePadding sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <CheckIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary={<Typography variant="caption">{f}</Typography>} />
              </ListItem>
            ))}
            {plan.features.length > 4 && (
              <ListItem disablePadding>
                <ListItemText primary={<Typography variant="caption" color="text.secondary">+{plan.features.length - 4} more</Typography>} />
              </ListItem>
            )}
          </List>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CircleIcon sx={{ fontSize: 8, color: plan.is_active ? 'success.main' : 'error.main' }} />
          <Typography variant="caption" color={plan.is_active ? 'success.main' : 'error.main'} fontWeight={600}>
            {plan.is_active ? 'Active' : 'Inactive'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminSubscriptions() {
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    adminApi.plans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const carrierPlans = plans.filter(p => p.role === 'carrier');
  const brokerPlans  = plans.filter(p => p.role === 'broker');
  const visiblePlans = tab === 0 ? carrierPlans : brokerPlans;

  function handleSaved(updated) {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingPlan(null);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <CreditCardIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Subscription Plans</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">Manage pricing and features for all subscription tiers</Typography>
      </Box>

      {/* Plans */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Card variant="outlined">
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={18} sx={{ mb: 0.75 }} />
                  <Skeleton variant="text" width="50%" height={18} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tab label={`Carrier Plans (${carrierPlans.length})`} />
            <Tab label={`Broker Plans (${brokerPlans.length})`} />
          </Tabs>
          {visiblePlans.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No plans found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {visiblePlans.map(plan => (
                <Grid item xs={12} sm={4} key={plan.id}>
                  <PlanCard plan={plan} onEdit={setEditingPlan} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {editingPlan && (
        <EditModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={handleSaved}
        />
      )}
    </Box>
  );
}
