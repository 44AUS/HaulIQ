import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Button, Chip,
  CircularProgress, ToggleButtonGroup, ToggleButton, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, Divider,
  TextField, InputAdornment, IconButton, Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = {
  broker: [
    {
      key: 'starter',
      name: 'Starter',
      monthly: 0,
      annual: 0,
      badge: null,
      intro: 'Key Features',
      features: [
        'Up to 5 active load postings',
        'Carrier search & booking',
        'Basic document management',
        'Email notifications',
        'Standard analytics',
      ],
    },
    {
      key: 'pro',
      name: 'Pro',
      monthly: 79,
      annual: 63,
      badge: 'Most Popular',
      intro: 'Everything in Starter, plus…',
      features: [
        'Unlimited load postings',
        'Instant Book feature',
        'Advanced analytics & reporting',
        'Network management',
        'Booking request management',
        'Priority email support',
      ],
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      monthly: 199,
      annual: 159,
      badge: null,
      intro: 'Everything in Pro, plus…',
      features: [
        'Dedicated account manager',
        'Custom carrier allowlists',
        'API access',
        'Load performance insights',
        'Custom integrations (TMS/ELD)',
        'SLA-backed uptime guarantee',
      ],
    },
  ],
  carrier: [
    {
      key: 'starter',
      name: 'Starter',
      monthly: 0,
      annual: 0,
      badge: null,
      intro: 'Key Features',
      features: [
        'Access to the load board',
        'Bid on up to 10 loads/month',
        'Document uploads (BOL, POD)',
        'Basic profit calculator',
        'Email notifications',
      ],
    },
    {
      key: 'pro',
      name: 'Pro',
      monthly: 49,
      annual: 39,
      badge: 'Most Popular',
      intro: 'Everything in Starter, plus…',
      features: [
        'Unlimited load bids',
        'Instant Book access',
        'Advanced profit & fuel analytics',
        'Earnings Brain AI suggestions',
        'Priority load visibility',
        'Priority support',
      ],
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      monthly: 149,
      annual: 119,
      badge: null,
      intro: 'Everything in Pro, plus…',
      features: [
        'Fleet management tools',
        'Multi-driver accounts',
        'Dedicated account manager',
        'Custom ELD integrations',
        'Load performance reporting',
        'API access',
      ],
    },
  ],
};

// ─── Feature comparison table ─────────────────────────────────────────────────
const FEATURE_TABLE = {
  broker: [
    { section: 'Load Management' },
    { label: 'Active load postings', values: ['5', 'Unlimited', 'Unlimited'] },
    { label: 'Instant Book', values: [false, true, true] },
    { label: 'Booking request management', values: [false, true, true] },
    { label: 'Load performance analytics', values: [false, true, true] },
    { section: 'Carrier Tools' },
    { label: 'Carrier search', values: [true, true, true] },
    { label: 'Network management', values: [false, true, true] },
    { label: 'Carrier allowlist', values: [false, false, true] },
    { label: 'Carrier reviews', values: [true, true, true] },
    { section: 'Documents & Compliance' },
    { label: 'Document management', values: [true, true, true] },
    { label: 'BOL / POD uploads', values: [true, true, true] },
    { label: 'Rate confirmation docs', values: [false, true, true] },
    { section: 'Support & Integrations' },
    { label: 'Email support', values: [true, true, true] },
    { label: 'Priority support', values: [false, true, true] },
    { label: 'Dedicated account manager', values: [false, false, true] },
    { label: 'API access', values: [false, false, true] },
    { label: 'TMS / ELD integrations', values: [false, false, true] },
  ],
  carrier: [
    { section: 'Load Board' },
    { label: 'Load board access', values: [true, true, true] },
    { label: 'Monthly load bids', values: ['10', 'Unlimited', 'Unlimited'] },
    { label: 'Instant Book', values: [false, true, true] },
    { label: 'Saved loads', values: [true, true, true] },
    { section: 'Analytics & Tools' },
    { label: 'Profit calculator', values: [true, true, true] },
    { label: 'Advanced earnings analytics', values: [false, true, true] },
    { label: 'Earnings Brain (AI)', values: [false, true, true] },
    { label: 'Fuel cost estimator', values: [false, true, true] },
    { section: 'Documents' },
    { label: 'Document uploads (BOL/POD)', values: [true, true, true] },
    { label: 'Document history', values: [true, true, true] },
    { section: 'Fleet & Account' },
    { label: 'Single driver account', values: [true, true, true] },
    { label: 'Multi-driver accounts', values: [false, false, true] },
    { label: 'Fleet management tools', values: [false, false, true] },
    { label: 'Dedicated account manager', values: [false, false, true] },
    { label: 'API access', values: [false, false, true] },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function FeatureValue({ val }) {
  if (val === true)  return <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />;
  if (val === false) return <RemoveIcon sx={{ fontSize: 16, color: 'text.disabled' }} />;
  return <Typography variant="body2" fontWeight={600}>{val}</Typography>;
}

function PlanCard({ plan, billing, currentKey, onActivate, activating }) {
  const price = billing === 'annual' ? plan.annual : plan.monthly;
  const isCurrent = currentKey === plan.key;
  const isFree = plan.monthly === 0;

  const statusLabel = isCurrent ? 'Current Plan' : 'Inactive';
  const statusColor = isCurrent ? '#22c55e' : '#b91c1c';
  const statusBg    = isCurrent ? 'rgba(34,197,94,0.12)' : 'rgba(185,28,28,0.12)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: isCurrent ? 'success.main' : 'divider', borderRadius: 2, overflow: 'hidden', height: '100%' }}>
      {/* Status badge */}
      <Box sx={{ textAlign: 'center', py: 0.75, bgcolor: statusBg }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {statusLabel}
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={800}>{plan.name}</Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography component="span" variant="h6" fontWeight={800}>
            {isFree ? 'Free' : `$${price}.00`}
          </Typography>
          {!isFree && (
            <Typography component="span" variant="caption" color="text.secondary">/mo</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 2.5, pb: 2 }}>
        {isCurrent ? (
          <Button fullWidth variant="outlined" color="success" disabled sx={{ fontWeight: 700 }}>
            Current Plan
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, fontWeight: 700, letterSpacing: '0.05em' }}
            disabled={activating === plan.key}
            onClick={() => onActivate(plan)}
            startIcon={activating === plan.key ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {activating === plan.key ? 'Processing…' : isFree ? 'Switch to Free' : 'Activate'}
          </Button>
        )}
      </Box>

      <Divider />

      <Box sx={{ px: 2.5, pt: 1.5, pb: 2.5, flex: 1 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.25, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
          {plan.intro}
        </Typography>
        {plan.features.map(f => (
          <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            <CheckIcon sx={{ fontSize: 15, color: 'text.secondary', mt: '2px', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">{f}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Referrals Tab ────────────────────────────────────────────────────────────
function ReferralsTab({ user }) {
  const [copied, setCopied] = useState(false);
  const referralCode = `HAULIQ-${(user?.name || 'USER').split(' ')[0].toUpperCase().slice(0, 6)}`;
  const referralLink = `https://hauliq.app/join?ref=${referralCode}`;

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 700, mx: 'auto' }}>
      {/* Hero */}
      <Card variant="outlined" sx={{ textAlign: 'center', p: 4 }}>
        <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Earn $25 per referral</Typography>
        <Typography variant="body2" color="text.secondary">
          Invite a broker or carrier to HaulIQ. When they activate a paid plan, you both get a $25 account credit.
        </Typography>
      </Card>

      {/* Referral link */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Your referral link</Typography>
        <TextField
          fullWidth
          size="small"
          value={referralLink}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={copy} size="small">
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {copied && <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>Copied!</Typography>}
      </Box>

      {/* How it works */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>How it works</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { step: '1', title: 'Share your link', desc: 'Send your unique link to a broker or carrier.' },
            { step: '2', title: 'They sign up', desc: 'They create an account using your referral link.' },
            { step: '3', title: 'Both earn $25', desc: 'When they activate a paid plan, you both get credit.' },
          ].map(({ step, title, desc }) => (
            <Paper key={step} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1, fontWeight: 800, fontSize: '0.85rem' }}>
                {step}
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
              <Typography variant="caption" color="text.secondary">{desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: 'Referrals sent', value: '—' },
          { label: 'Converted', value: '—' },
          { label: 'Credits earned', value: '$0' },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent sx={{ textAlign: 'center', py: '16px !important' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h5" fontWeight={800}>{value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* History */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Referral history</Typography>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No referrals yet</Typography>
          <Typography variant="caption" color="text.disabled">Share your link above to get started</Typography>
        </Paper>
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Billing() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [billing, setBilling] = useState('monthly');
  const [currentSub, setCurrentSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const rolePlans = PLANS[user?.role] || PLANS.carrier;

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/subscriptions/plans?role=${user.role}`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/subscriptions/me`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([p, s]) => {
      setPlans(Array.isArray(p) ? p : []);
      setCurrentSub(s && !s.detail ? s : null);
      setLoading(false);
    });
  }, [token, user.role]);

  // Match current sub tier to our plan keys
  const currentKey = currentSub?.plan?.tier === 'elite' ? 'enterprise'
    : currentSub?.plan?.tier === 'pro' ? 'pro'
    : currentSub ? 'starter' : null;

  const daysLeft = currentSub?.current_period_end
    ? Math.max(0, Math.ceil((new Date(currentSub.current_period_end) - Date.now()) / 86400000))
    : null;

  const handleActivate = (plan) => {
    if (plan.monthly === 0) {
      // Free/starter — use subscriptions change endpoint
      const backendPlan = plans.find(p => p.tier === 'basic' || p.price === 0);
      if (backendPlan) {
        setActivating(plan.key);
        fetch(`${API}/api/subscriptions/change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan_id: backendPlan.id }),
        }).finally(() => setActivating(null));
      }
      return;
    }
    // Paid plan — go to checkout
    const tierMap = { pro: 'pro', enterprise: 'elite' };
    const backendTier = tierMap[plan.key];
    const backendPlan = plans.find(p => p.tier === backendTier);
    if (backendPlan) {
      navigate(`/checkout?plan_id=${backendPlan.id}`);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon color="primary" /> Billing
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your subscription plan and referrals
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Subscription Plans" sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label="Referrals" sx={{ fontWeight: 600, textTransform: 'none' }} />
      </Tabs>

      {/* ── Subscription Plans Tab ─────────────────────────────────────────── */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : (
            <>
              {/* Current plan card */}
              {currentSub && (
                <Box sx={{ maxWidth: 380, mx: 'auto', width: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={700} textAlign="center" sx={{ mb: 1.5 }}>Current Plan</Typography>
                  <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
                    <Box sx={{ bgcolor: 'warning.main', textAlign: 'center', py: 0.6 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: 'warning.contrastText', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {currentSub.status === 'trialing' ? 'Trialing' : currentSub.status}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" fontWeight={800}>{currentSub.plan?.name}</Typography>
                      {daysLeft !== null && (
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>{daysLeft} days left</Typography>
                      )}
                    </Box>
                    <Divider />
                    <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Renews</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {currentSub.current_period_end ? new Date(currentSub.current_period_end).toLocaleDateString() : '—'}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Billing toggle */}
              <Box sx={{ textAlign: 'center' }}>
                <ToggleButtonGroup value={billing} exclusive onChange={(_, v) => v && setBilling(v)} size="small">
                  <ToggleButton value="monthly" sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}>Monthly</ToggleButton>
                  <ToggleButton value="annual"  sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}>
                    Annual
                    <Chip label="Save 20%" size="small" color="success" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                  {billing === 'annual' ? 'Annual' : 'Monthly'} Plans
                </Typography>
              </Box>

              {/* Plan cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {rolePlans.map(plan => (
                  <PlanCard
                    key={plan.key}
                    plan={plan}
                    billing={billing}
                    currentKey={currentKey}
                    onActivate={handleActivate}
                    activating={activating}
                  />
                ))}
              </Box>

              {/* Feature comparison table */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Full Feature Comparison</Typography>
                <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1rem', py: 1.5 }}>Features</TableCell>
                        {rolePlans.map(p => (
                          <TableCell key={p.key} align="center" sx={{ fontWeight: 700, whiteSpace: 'nowrap', py: 1.5 }}>
                            {p.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(FEATURE_TABLE[user?.role] || FEATURE_TABLE.carrier).map((row, i) => {
                        if (row.section) {
                          return (
                            <TableRow key={i}>
                              <TableCell colSpan={4} sx={{ bgcolor: 'action.selected', py: 0.75, pl: 2 }}>
                                <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                                  {row.section}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                            <TableCell sx={{ py: 1 }}>{row.label}</TableCell>
                            {row.values.map((v, vi) => (
                              <TableCell key={vi} align="center" sx={{ py: 1 }}>
                                <FeatureValue val={v} />
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </Box>

              {/* Cancel */}
              {currentSub && currentSub.status !== 'cancelled' && currentKey !== 'starter' && (
                <Alert severity="warning" sx={{ maxWidth: 500 }}>
                  To cancel your plan, contact{' '}
                  <Typography component="a" href="mailto:support@hauliq.app" variant="body2" color="warning.main">
                    support@hauliq.app
                  </Typography>
                  . You'll keep access until the end of your billing period.
                </Alert>
              )}
            </>
          )}
        </Box>
      )}

      {/* ── Referrals Tab ─────────────────────────────────────────────────── */}
      {tab === 1 && <ReferralsTab user={user} />}
    </Box>
  );
}
