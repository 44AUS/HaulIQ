import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip,
  List, ListItem, ListItemIcon, ListItemText, IconButton,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TIER_ORDER = { basic: 0, pro: 1, elite: 2 };

export default function ManageSubscription() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/subscriptions/plans?role=${user.role}`, { headers }).then(r => r.json()),
      fetch(`${API}/api/subscriptions/me`, { headers }).then(r => r.json()),
    ])
      .then(([p, s]) => {
        setPlans(Array.isArray(p) ? p : []);
        setCurrentSub(s && !s.detail ? s : null);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load subscription info.'); setLoading(false); });
  }, [token, user.role]);

  const handleSelectPlan = (plan) => {
    if (plan.price === 0) {
      fetch(`${API}/api/subscriptions/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: plan.id }),
      }).then(() => navigate(`/${user.role}/dashboard`));
      return;
    }
    navigate(`/checkout?plan_id=${plan.id}`);
  };

  const handleCancel = async () => {
    setCancelling(true);
    await fetch(`${API}/api/subscriptions/cancel`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCancelling(false);
    setShowCancelModal(false);
    navigate(`/${user.role}/dashboard`);
  };

  const currentTier = currentSub?.plan?.tier || 'basic';

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>Manage Subscription</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {currentSub
            ? `Currently on ${currentSub.plan.name} · renews ${new Date(currentSub.current_period_end).toLocaleDateString()}`
            : 'No active subscription'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {currentSub?.status === 'past_due' && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          Your payment is past due. Update your payment method to keep access.
        </Alert>
      )}

      {/* Plan cards */}
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {plans.map(plan => {
          const isCurrent = currentSub?.plan?.id === plan.id;
          const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[currentTier];

          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  bgcolor: isCurrent ? 'rgba(21,101,192,0.04)' : 'background.paper',
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                  {isCurrent && (
                    <Chip label="Current Plan" size="small" color="success" sx={{ alignSelf: 'flex-start', mb: 1.5 }} />
                  )}
                  {plan.tier === 'pro' && !isCurrent && (
                    <Chip label="Most Popular" size="small" color="warning" sx={{ alignSelf: 'flex-start', mb: 1.5 }} />
                  )}
                  <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{plan.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>{plan.description}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography component="span" variant="h4" fontWeight={800}>${plan.price}</Typography>
                    <Typography component="span" variant="body2" color="text.secondary">/mo</Typography>
                  </Box>
                  <List dense disablePadding sx={{ flex: 1, mb: 2 }}>
                    {(plan.features || []).map((f, i) => (
                      <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={<Typography variant="body2" color="text.secondary">{f}</Typography>} />
                      </ListItem>
                    ))}
                  </List>
                  {isCurrent ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={1}>Active</Typography>
                  ) : (
                    <Button
                      variant={isUpgrade ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => handleSelectPlan(plan)}
                      startIcon={plan.price > 0 ? <CreditCardIcon /> : null}
                    >
                      {isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Cancel section */}
      {currentSub && currentSub.status !== 'cancelled' && currentTier !== 'basic' && (
        <Card variant="outlined">
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" fontWeight={600}>Cancel Subscription</Typography>
              <Typography variant="caption" color="text.secondary">
                You'll be downgraded to Basic at the end of your billing period.
              </Typography>
            </Box>
            <Button variant="outlined" color="error" onClick={() => setShowCancelModal(true)}>
              Cancel Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel confirm dialog */}
      <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Cancel Subscription?
          <IconButton size="small" onClick={() => setShowCancelModal(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Your {currentSub?.plan?.name} plan will remain active until{' '}
            <Typography component="span" fontWeight={700} color="text.primary">
              {currentSub ? new Date(currentSub.current_period_end).toLocaleDateString() : ''}
            </Typography>
            , then you'll be moved to the free Basic plan.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowCancelModal(false)} fullWidth>
            Keep Plan
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={cancelling}
            fullWidth
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
