import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Chip,
  List, ListItem, ListItemIcon, ListItemText, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CircleIcon from '@mui/icons-material/Circle';
import { CARRIER_PLANS, BROKER_PLANS } from '../../data/sampleData';

function PlanCard({ plan, onEdit }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderColor: plan.color === 'brand' ? 'primary.main' : plan.color === 'purple' ? 'secondary.main' : 'divider',
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>{plan.name}</Typography>
              {plan.popular && <Chip label="Popular" size="small" color="success" />}
            </Box>
            <Typography variant="caption" color="text.secondary">{plan.description}</Typography>
          </Box>
          <IconButton size="small" onClick={() => onEdit(plan)}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Typography variant="h4" fontWeight={800} mb={2}>
          {plan.price === 0 ? 'Free' : `$${plan.price}/${plan.period}`}
        </Typography>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <CircleIcon sx={{ fontSize: 8, color: 'success.main' }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>Active</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function EditModal({ plan, onClose }) {
  const [price, setPrice] = useState(plan.price);
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
          <Box>
            <Typography variant="body2" fontWeight={600} mb={1}>Features</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {plan.features.map((f, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon sx={{ fontSize: 13, color: 'primary.main', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>{f}</Typography>
                  <IconButton size="small" sx={{ '&:hover': { color: 'error.main' } }}>
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
        <Button variant="contained" onClick={onClose} fullWidth>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminSubscriptions() {
  const [tab, setTab] = useState(0);
  const [editingPlan, setEditingPlan] = useState(null);

  const plans = tab === 0 ? CARRIER_PLANS : BROKER_PLANS;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CreditCardIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Subscription Plans</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Manage pricing and features for all subscription tiers</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>Create Plan</Button>
      </Box>

      {/* Summary stats */}
      <Grid container spacing={2}>
        {[
          { label: 'Total MRR',    value: '$48,200' },
          { label: 'Carrier Subs', value: '1,284' },
          { label: 'Broker Subs',  value: '804' },
          { label: 'Churn Rate',   value: '2.1%' },
        ].map(({ label, value }) => (
          <Grid item xs={6} sm={3} key={label}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={0.5}>{label}</Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tab label="Carrier Plans" />
          <Tab label="Broker Plans" />
        </Tabs>
        <Grid container spacing={2}>
          {plans.map(plan => (
            <Grid item xs={12} sm={4} key={plan.id}>
              <PlanCard plan={plan} onEdit={setEditingPlan} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {editingPlan && <EditModal plan={editingPlan} onClose={() => setEditingPlan(null)} />}
    </Box>
  );
}
