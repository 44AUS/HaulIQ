import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi, loadsApi, bidsApi, freightPaymentsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import {
  Box, Typography, Button, Card, CardContent, Chip, CircularProgress, Alert,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, InputAdornment, Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';

// Lazy-load Stripe — will fail gracefully if @stripe/react-stripe-js not installed
let loadStripe, Elements, PaymentElement, useStripe, useElements;
try {
  ({ loadStripe } = require('@stripe/stripe-js'));
  ({ Elements, PaymentElement, useStripe, useElements } = require('@stripe/react-stripe-js'));
} catch (_) {
  loadStripe = null;
}

const stripePromise = loadStripe && process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Payment breakdown row helper ──────────────────────────────────────────────
function AmountRow({ label, value, bold, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 500} sx={color ? { color } : {}}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Inner form that uses Stripe hooks ─────────────────────────────────────────
function StripePaymentForm({ chargeData, onPaid, onClose }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const stripe = useStripe?.() ?? null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const elements = useElements?.() ?? null;
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (result.error) {
        setPayError(result.error.message);
      } else {
        onPaid();
      }
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 2 }}>
        <AmountRow label="Load Rate" value={`$${chargeData.amount?.toLocaleString()}`} />
        <AmountRow label="Platform Fee (1.5%)" value={`-$${chargeData.fee_amount?.toLocaleString()}`} color="error.main" />
        <Divider sx={{ my: 0.5 }} />
        <AmountRow label="Carrier Receives" value={`$${chargeData.carrier_amount?.toLocaleString()}`} bold color="success.main" />
      </Box>

      {Elements && PaymentElement ? (
        <Box sx={{ mb: 2 }}>
          <PaymentElement />
        </Box>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Stripe UI components not installed. Run: <code>npm install @stripe/stripe-js @stripe/react-stripe-js</code>
        </Alert>
      )}

      {payError && <Alert severity="error" sx={{ mb: 1.5 }}>{payError}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose} disabled={paying}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={paying || !stripe}
          startIcon={paying ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
        >
          {paying ? 'Processing…' : `Pay $${chargeData.amount?.toLocaleString()}`}
        </Button>
      </Box>
    </Box>
  );
}

// ── Payment Dialog ─────────────────────────────────────────────────────────────
function PaymentDialog({ bookingId, onClose, onPaid }) {
  const [chargeData, setChargeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    freightPaymentsApi.charge(bookingId)
      .then(data => setChargeData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePaid = () => {
    onPaid();
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LockIcon fontSize="small" color="primary" />
        Pay Load into Escrow
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={onClose}>Close</Button>
          </Box>
        ) : chargeData ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Funds will be held in escrow until you release payment after delivery confirmation.
            </Typography>
            {stripePromise && chargeData.client_secret && Elements ? (
              <Elements stripe={stripePromise} options={{ clientSecret: chargeData.client_secret }}>
                <StripePaymentForm chargeData={chargeData} onPaid={handlePaid} onClose={onClose} />
              </Elements>
            ) : (
              <Box>
                <AmountRow label="Load Rate" value={`$${chargeData.amount?.toLocaleString()}`} />
                <AmountRow label="Platform Fee (1.5%)" value={`-$${chargeData.fee_amount?.toLocaleString()}`} color="error.main" />
                <Divider sx={{ my: 0.5 }} />
                <AmountRow label="Carrier Receives" value={`$${chargeData.carrier_amount?.toLocaleString()}`} bold color="success.main" />
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Stripe frontend library not configured. Set <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> and run{' '}
                  <code>npm install @stripe/stripe-js @stripe/react-stripe-js</code>.
                </Alert>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button variant="outlined" onClick={onClose}>Close</Button>
                </Box>
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── Payment status chip helper ─────────────────────────────────────────────────
function paymentChip(payStatus) {
  if (!payStatus || payStatus === 'unpaid') return null;
  const map = {
    pending:  { label: 'Pay Pending', color: 'default' },
    escrowed: { label: 'In Escrow',   color: 'info' },
    released: { label: 'Paid',        color: 'success' },
    failed:   { label: 'Pay Failed',  color: 'error' },
    refunded: { label: 'Refunded',    color: 'warning' },
  };
  const cfg = map[payStatus] || { label: payStatus, color: 'default' };
  return (
    <Chip
      icon={<AttachMoneyIcon sx={{ fontSize: '14px !important' }} />}
      label={cfg.label}
      color={cfg.color}
      size="small"
      variant="outlined"
    />
  );
}

function statusChip(status) {
  const map = {
    pending:   { label: 'Pending',   color: 'warning' },
    approved:  { label: 'Approved',  color: 'success' },
    denied:    { label: 'Denied',    color: 'error' },
    accepted:  { label: 'Accepted',  color: 'success' },
    rejected:  { label: 'Rejected',  color: 'error' },
    countered: { label: 'Countered', color: 'info' },
    withdrawn: { label: 'Withdrawn', color: 'default' },
  };
  const cfg = map[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ textTransform: 'capitalize' }} />;
}

export default function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [bids, setBids] = useState([]);
  const [loadCache, setLoadCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [reviewModal, setReviewModal] = useState(null);
  const [brokerNote, setBrokerNote] = useState('');

  const [bidModal, setBidModal] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [bidActing, setBidActing] = useState(false);

  // Payment state
  const [paymentStatuses, setPaymentStatuses] = useState({}); // bookingId -> payment status object
  const [paymentDialog, setPaymentDialog] = useState(null);   // bookingId or null
  const [releasing, setReleasing] = useState({});             // bookingId -> bool

  const fetchBookings = useCallback(() => {
    setLoading(true);
    bookingsApi.pending()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBookings(list);
        const uniqueLoadIds = [...new Set(list.map(b => b.load_id).filter(Boolean))];
        Promise.all(uniqueLoadIds.map(lid =>
          loadsApi.get(lid).then(l => ({ id: lid, load: adaptLoad(l) })).catch(() => ({ id: lid, load: null }))
        )).then(results => {
          const cache = {};
          results.forEach(r => { cache[r.id] = r.load; });
          setLoadCache(cache);
        });
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchBids = useCallback(() => {
    setBidsLoading(true);
    bidsApi.myLoads()
      .then(data => setBids(Array.isArray(data) ? data : []))
      .finally(() => setBidsLoading(false));
  }, []);

  // Fetch active loads (broker-active) to get approved/in_transit/completed bookings
  const [activeBookings, setActiveBookings] = useState([]);
  const fetchActiveBookings = useCallback(() => {
    bookingsApi.brokerActive()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setActiveBookings(list);
        // Fetch payment status for each booking that has a booking_id
        const bookingIds = list.map(b => b.booking_id).filter(Boolean);
        bookingIds.forEach(bid => {
          freightPaymentsApi.status(bid)
            .then(ps => setPaymentStatuses(prev => ({ ...prev, [bid]: ps })))
            .catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchBids();
    fetchActiveBookings();
  }, [fetchBookings, fetchBids, fetchActiveBookings]);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBids = bids.filter(b => b.status !== 'withdrawn');

  const handleReviewBooking = (approved) => {
    bookingsApi.review(reviewModal.item.id, { approved, broker_note: brokerNote })
      .then(() => { fetchBookings(); fetchActiveBookings(); setReviewModal(null); setBrokerNote(''); })
      .catch(err => alert(err.message));
  };

  const handleBidAction = () => {
    if (!bidModal) return;
    setBidActing(true);
    const { bid, mode } = bidModal;
    let call;
    if (mode === 'accept') call = bidsApi.accept(bid.id);
    else if (mode === 'reject') call = bidsApi.reject(bid.id);
    else call = bidsApi.counter(bid.id, { counter_amount: parseFloat(counterAmount), counter_note: counterNote || null });

    call
      .then(() => { fetchBids(); setBidModal(null); setCounterAmount(''); setCounterNote(''); })
      .catch(err => alert(err.message))
      .finally(() => setBidActing(false));
  };

  const handleRelease = async (bookingId) => {
    setReleasing(r => ({ ...r, [bookingId]: true }));
    try {
      await freightPaymentsApi.release(bookingId);
      setPaymentStatuses(prev => ({
        ...prev,
        [bookingId]: { ...prev[bookingId], status: 'released' },
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setReleasing(r => ({ ...r, [bookingId]: false }));
    }
  };

  const handlePaymentSuccess = (bookingId) => {
    // Re-fetch status after payment
    freightPaymentsApi.status(bookingId)
      .then(ps => setPaymentStatuses(prev => ({ ...prev, [bookingId]: ps })))
      .catch(() => {});
    fetchActiveBookings();
  };

  const getLoad = (loadId) => loadCache[loadId] || null;

  // Active loads tab: approved / in_transit / completed loads
  const bookedLoads = activeBookings.filter(b => ['booked', 'in_transit', 'delivered'].includes(b.status));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Booking Requests</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage carrier booking requests and bids on your loads
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Book Now (${pendingBookings.length})`} />
        <Tab label={`Bids / Offers (${activeBids.filter(b => b.status === 'pending').length})`} />
        <Tab label={`Active Loads (${bookedLoads.length})`} />
      </Tabs>

      {/* Bookings Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : pendingBookings.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No pending booking requests</Typography>
            </Paper>
          ) : pendingBookings.map(booking => {
            const load = getLoad(booking.load_id);
            return (
              <Card key={booking.id} variant="outlined">
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {load ? `${load.origin} → ${load.dest}` : `Load #${String(booking.load_id).slice(0, 8)}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.carrier_name || 'Carrier'}{booking.carrier_mc ? ` · MC-${booking.carrier_mc}` : ''}
                      </Typography>
                      <Button
                        component={Link}
                        to={`/c/${booking.carrier_id?.slice(0,8)}`}
                        state={{ carrierId: booking.carrier_id }}
                        variant="text"
                        size="small"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                        sx={{ fontSize: '0.7rem', minHeight: 0, py: 0 }}
                      >
                        View profile
                      </Button>
                    </Box>
                    {load && (
                      <Typography variant="body2" color="text.secondary">
                        {load.type} · ${load.rate?.toLocaleString()} · {load.miles} mi
                      </Typography>
                    )}
                    {booking.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                        "{booking.note}"
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled">
                      {new Date(booking.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {statusChip(booking.status)}
                    <Button variant="outlined" size="small" onClick={() => setReviewModal({ type: 'booking', item: booking })}>
                      Review
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Bids Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bidsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : activeBids.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No bids yet</Typography>
            </Paper>
          ) : activeBids.map(bid => {
            const diff = bid.load_rate ? ((bid.amount - bid.load_rate) / bid.load_rate * 100) : null;
            const isAbove = diff !== null && diff >= 0;
            const loadNum = String(bid.load_id).slice(0, 8).toUpperCase();
            return (
              <Card key={bid.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                {/* Clickable load header */}
                <Box
                  component={Link}
                  to={`/broker/loads/${bid.load_id}`}
                  state={{ from: 'Booking Requests' }}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2, py: 1.25, bgcolor: 'action.hover',
                    borderBottom: '1px solid', borderColor: 'divider',
                    textDecoration: 'none',
                    '&:hover': { bgcolor: 'action.selected' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.05em' }}>
                      #{loadNum}
                    </Typography>
                    {bid.load_origin && bid.load_dest ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="body2" fontWeight={600} color="text.primary">{bid.load_origin}</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="body2" fontWeight={600} color="text.primary">{bid.load_dest}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" fontWeight={600}>Load #{loadNum}</Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {statusChip(bid.status)}
                    <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  </Box>
                </Box>

                {/* Bid body */}
                <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Amount row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Bid Amount</Typography>
                          <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.1 }}>
                            ${bid.amount.toLocaleString()}
                          </Typography>
                        </Box>
                        {bid.load_rate && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Listed Rate</Typography>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ lineHeight: 1.1 }}>
                              ${bid.load_rate.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                        {diff !== null && (
                          <Chip
                            size="small"
                            icon={isAbove ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${isAbove ? '+' : ''}${diff.toFixed(1)}%`}
                            color={isAbove ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Box>

                      {/* Carrier */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: bid.note || bid.counter_amount ? 0.75 : 0 }}>
                        <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography
                          component={bid.carrier_id ? Link : 'span'}
                          to={bid.carrier_id ? `/c/${bid.carrier_id?.slice(0, 8)}` : undefined}
                          state={bid.carrier_id ? { carrierId: bid.carrier_id } : undefined}
                          variant="body2"
                          fontWeight={600}
                          sx={bid.carrier_id ? { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } } : {}}
                        >
                          {bid.carrier_name || 'Carrier'}
                        </Typography>
                        {bid.carrier_mc && (
                          <Typography variant="caption" color="text.disabled">MC-{bid.carrier_mc}</Typography>
                        )}
                      </Box>

                      {bid.note && (
                        <Paper variant="outlined" sx={{ px: 1.5, py: 0.75, mt: 0.75, bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{bid.note}"
                          </Typography>
                        </Paper>
                      )}

                      {bid.counter_amount && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
                          <SyncAltIcon sx={{ fontSize: 13, color: 'info.main' }} />
                          <Typography variant="caption" color="info.main">
                            Your counter: <strong>${bid.counter_amount.toLocaleString()}</strong>
                            {bid.counter_note && ` — ${bid.counter_note}`}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {bid.status === 'pending' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, minWidth: 100 }}>
                        <Button
                          fullWidth size="small" variant="contained" color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => setBidModal({ bid, mode: 'accept' })}
                        >
                          Accept
                        </Button>
                        <Button
                          fullWidth size="small" variant="outlined" color="info"
                          startIcon={<SyncAltIcon />}
                          onClick={() => { setBidModal({ bid, mode: 'counter' }); setCounterAmount(String(bid.load_rate || '')); }}
                        >
                          Counter
                        </Button>
                        <Button
                          fullWidth size="small" variant="outlined" color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => setBidModal({ bid, mode: 'reject' })}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Active Loads Tab — payment actions */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bookedLoads.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No active or completed loads</Typography>
            </Paper>
          ) : bookedLoads.map(load => {
            const bookingId = load.booking_id;
            const ps = paymentStatuses[bookingId];
            const payStatus = ps?.status || 'unpaid';
            const isEscrowed = payStatus === 'escrowed';
            const isUnpaidOrPending = payStatus === 'unpaid' || payStatus === 'pending' || payStatus === 'failed';

            return (
              <Card key={load.id} variant="outlined">
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {load.origin} → {load.destination}
                      </Typography>
                      <Chip
                        label={load.status === 'in_transit' ? 'In Transit' : load.status === 'delivered' ? 'Delivered' : 'Booked'}
                        size="small"
                        color={load.status === 'delivered' ? 'success' : load.status === 'in_transit' ? 'info' : 'warning'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {load.load_type} · ${load.rate?.toLocaleString()} · {load.miles} mi
                      {load.carrier_name ? ` · ${load.carrier_name}` : ''}
                    </Typography>
                    {ps && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                        {paymentChip(payStatus)}
                        {ps.carrier_amount && payStatus !== 'unpaid' && (
                          <Typography variant="caption" color="text.disabled">
                            Carrier receives: ${ps.carrier_amount?.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    {/* Pay Escrow button */}
                    {bookingId && isUnpaidOrPending && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<LockIcon />}
                        onClick={() => setPaymentDialog(bookingId)}
                      >
                        Pay Escrow
                      </Button>
                    )}
                    {/* Release Payment button — shown when escrowed */}
                    {bookingId && isEscrowed && (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        disabled={releasing[bookingId]}
                        startIcon={releasing[bookingId] ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                        onClick={() => handleRelease(bookingId)}
                      >
                        {releasing[bookingId] ? 'Releasing…' : 'Release Payment'}
                      </Button>
                    )}
                    {payStatus === 'released' && (
                      <Chip label="Paid Out" color="success" size="small" icon={<CheckIcon />} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Booking review modal */}
      {reviewModal && reviewModal.type === 'booking' && (
        <Dialog open onClose={() => setReviewModal(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Review Booking Request</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {(() => { const load = getLoad(reviewModal.item.load_id); return load ? `${load.origin} → ${load.dest}` : ''; })()}
              </Typography>
              <Button
                component={Link}
                to={`/c/${reviewModal.item.carrier_id?.slice(0,8)}`}
                state={{ carrierId: reviewModal.item.carrier_id }}
                variant="text"
                size="small"
                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                onClick={() => setReviewModal(null)}
                sx={{ fontSize: '0.7rem' }}
              >
                Carrier profile
              </Button>
            </Box>
            {reviewModal.item.note && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Carrier note:</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>"{reviewModal.item.note}"</Typography>
              </Paper>
            )}
            <TextField
              fullWidth size="small" label="Note to carrier (optional)" multiline rows={2}
              placeholder="Add a message..."
              value={brokerNote} onChange={e => setBrokerNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button variant="text" onClick={() => setReviewModal(null)}>Cancel</Button>
            <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => handleReviewBooking(false)}>
              Deny
            </Button>
            <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => handleReviewBooking(true)}>
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bid action modal */}
      {bidModal && (
        <Dialog open onClose={() => setBidModal(null)} maxWidth="sm" fullWidth>
          {bidModal.mode === 'counter' ? (
            <>
              <DialogTitle>Counter Offer</DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Carrier bid <strong>${bidModal.bid.amount.toLocaleString()}</strong>
                  {bidModal.bid.load_rate && <> · Listed at <strong>${bidModal.bid.load_rate.toLocaleString()}</strong></>}
                </Typography>
                <TextField
                  fullWidth size="small" label="Your counter amount" type="number"
                  value={counterAmount} onChange={e => setCounterAmount(e.target.value)} autoFocus
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
                <TextField
                  fullWidth size="small" label="Note to carrier (optional)" multiline rows={2}
                  value={counterNote} onChange={e => setCounterNote(e.target.value)}
                  placeholder="Explain your counter offer..."
                />
              </DialogContent>
              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button variant="outlined" onClick={() => setBidModal(null)}>Cancel</Button>
                <Button
                  variant="contained"
                  color="info"
                  disabled={!counterAmount || bidActing}
                  onClick={handleBidAction}
                  startIcon={bidActing ? <CircularProgress size={14} color="inherit" /> : null}
                >
                  {bidActing ? 'Sending…' : 'Send Counter'}
                </Button>
              </DialogActions>
            </>
          ) : (
            <>
              <DialogTitle>
                {bidModal.mode === 'accept' ? 'Accept Bid?' : 'Reject Bid?'}
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary">
                  {bidModal.mode === 'accept'
                    ? <>Accept <strong style={{ color: 'inherit' }}>${bidModal.bid.amount.toLocaleString()}</strong> from {bidModal.bid.carrier_name || 'this carrier'}?</>
                    : <>Reject <strong>${bidModal.bid.amount.toLocaleString()}</strong> from {bidModal.bid.carrier_name || 'this carrier'}?</>
                  }
                </Typography>
              </DialogContent>
              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button variant="outlined" onClick={() => setBidModal(null)}>Cancel</Button>
                <Button
                  variant="contained"
                  color={bidModal.mode === 'accept' ? 'success' : 'error'}
                  disabled={bidActing}
                  onClick={handleBidAction}
                  startIcon={bidActing ? <CircularProgress size={14} color="inherit" /> : bidModal.mode === 'accept' ? <CheckIcon /> : <CloseIcon />}
                >
                  {bidActing ? 'Processing…' : bidModal.mode === 'accept' ? 'Accept' : 'Reject'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      )}

      {/* Payment dialog */}
      {paymentDialog && (
        <PaymentDialog
          bookingId={paymentDialog}
          onClose={() => setPaymentDialog(null)}
          onPaid={() => handlePaymentSuccess(paymentDialog)}
        />
      )}
    </Box>
  );
}
