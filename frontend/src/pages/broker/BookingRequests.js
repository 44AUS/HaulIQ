import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { bookingsApi, loadsApi, bidsApi, freightPaymentsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

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

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

const tabBtnStyle = (active) => ({
  flex: 1, padding: '8px 12px', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: active ? 600 : 400,
  background: 'none', border: 'none', borderBottom: active ? '2px solid var(--ion-color-primary)' : '2px solid transparent',
  color: active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', cursor: 'pointer',
});

const STATUS_BADGE = {
  pending:   { bg: '#ed6c02', color: '#fff', label: 'Pending' },
  approved:  { bg: '#2e7d32', color: '#fff', label: 'Approved' },
  denied:    { bg: '#d32f2f', color: '#fff', label: 'Denied' },
  accepted:  { bg: '#2e7d32', color: '#fff', label: 'Accepted' },
  rejected:  { bg: '#d32f2f', color: '#fff', label: 'Rejected' },
  countered: { bg: '#0288d1', color: '#fff', label: 'Countered' },
  withdrawn: { bg: 'var(--ion-color-medium)', color: '#fff', label: 'Withdrawn' },
};

const PAY_BADGE = {
  pending:  { bg: 'transparent', border: '1px solid #ed6c02', color: '#ed6c02', label: 'Pay Pending' },
  escrowed: { bg: 'transparent', border: '1px solid #0288d1', color: '#0288d1', label: 'In Escrow' },
  released: { bg: 'transparent', border: '1px solid #2e7d32', color: '#2e7d32', label: 'Paid' },
  failed:   { bg: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', label: 'Pay Failed' },
  refunded: { bg: 'transparent', border: '1px solid #ed6c02', color: '#ed6c02', label: 'Refunded' },
};

function paymentBadge(payStatus) {
  if (!payStatus || payStatus === 'unpaid') return null;
  const cfg = PAY_BADGE[payStatus] || { bg: 'transparent', border: '1px solid var(--ion-color-medium)', color: 'var(--ion-color-medium)', label: payStatus };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, border: cfg.border, color: cfg.color }}>
      <IonIcon name="cash-outline" style={{ fontSize: 12 }} />
      {cfg.label}
    </span>
  );
}

function statusBadge(status) {
  const cfg = STATUS_BADGE[status] || { bg: 'var(--ion-color-medium)', color: '#fff', label: status };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color, textTransform: 'capitalize' }}>
      {cfg.label}
    </span>
  );
}

function AmountRow({ label, value, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: bold ? 700 : 500, color: color || 'var(--ion-text-color)' }}>{value}</span>
    </div>
  );
}

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
      if (result.error) setPayError(result.error.message);
      else onPaid();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <AmountRow label="Load Rate" value={`$${chargeData.amount?.toLocaleString()}`} />
        <AmountRow label="Platform Fee (1.5%)" value={`-$${chargeData.fee_amount?.toLocaleString()}`} color="#d32f2f" />
        <div style={{ borderTop: '1px solid var(--ion-border-color)', margin: '4px 0' }} />
        <AmountRow label="Carrier Receives" value={`$${chargeData.carrier_amount?.toLocaleString()}`} bold color="#2e7d32" />
      </div>

      {Elements && PaymentElement ? (
        <div style={{ marginBottom: 16 }}><PaymentElement /></div>
      ) : (
        <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(237,108,2,0.08)', border: '1px solid rgba(237,108,2,0.3)', borderRadius: 6, color: '#b45309', fontSize: '0.875rem' }}>
          Stripe UI components not installed. Run: <code>npm install @stripe/stripe-js @stripe/react-stripe-js</code>
        </div>
      )}

      {payError && (
        <div style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{payError}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} disabled={paying} style={{ padding: '8px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: paying ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
        <button type="submit" disabled={paying || !stripe} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (paying || !stripe) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: (paying || !stripe) ? 0.7 : 1 }}>
          {paying ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="send-outline" style={{ fontSize: 14 }} />}
          {paying ? 'Processing…' : `Pay $${chargeData.amount?.toLocaleString()}`}
        </button>
      </div>
    </form>
  );
}

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

  const handlePaid = () => { onPaid(); onClose(); };

  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '480px', '--height': 'auto', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <IonIcon name="lock-closed-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', flex: 1 }}>Pay Load into Escrow</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><IonSpinner name="crescent" /></div>
        ) : error ? (
          <div>
            <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
            <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Close</button>
          </div>
        ) : chargeData ? (
          <>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              Funds will be held in escrow until you release payment after delivery confirmation.
            </p>
            {stripePromise && chargeData.client_secret && Elements ? (
              <Elements stripe={stripePromise} options={{ clientSecret: chargeData.client_secret }}>
                <StripePaymentForm chargeData={chargeData} onPaid={handlePaid} onClose={onClose} />
              </Elements>
            ) : (
              <div>
                <AmountRow label="Load Rate" value={`$${chargeData.amount?.toLocaleString()}`} />
                <AmountRow label="Platform Fee (1.5%)" value={`-$${chargeData.fee_amount?.toLocaleString()}`} color="#d32f2f" />
                <div style={{ borderTop: '1px solid var(--ion-border-color)', margin: '4px 0' }} />
                <AmountRow label="Carrier Receives" value={`$${chargeData.carrier_amount?.toLocaleString()}`} bold color="#2e7d32" />
                <div style={{ marginTop: 16, padding: '10px 14px', backgroundColor: 'rgba(237,108,2,0.08)', border: '1px solid rgba(237,108,2,0.3)', borderRadius: 6, color: '#b45309', fontSize: '0.875rem' }}>
                  Stripe frontend library not configured. Set <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> and run{' '}
                  <code>npm install @stripe/stripe-js @stripe/react-stripe-js</code>.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Close</button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </IonModal>
  );
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

  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [releasing, setReleasing] = useState({});

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

  const [activeBookings, setActiveBookings] = useState([]);
  const fetchActiveBookings = useCallback(() => {
    bookingsApi.brokerActive()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setActiveBookings(list);
        list.map(b => b.booking_id).filter(Boolean).forEach(bid => {
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
      setPaymentStatuses(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], status: 'released' } }));
    } catch (err) {
      alert(err.message);
    } finally {
      setReleasing(r => ({ ...r, [bookingId]: false }));
    }
  };

  const handlePaymentSuccess = (bookingId) => {
    freightPaymentsApi.status(bookingId)
      .then(ps => setPaymentStatuses(prev => ({ ...prev, [bookingId]: ps })))
      .catch(() => {});
    fetchActiveBookings();
  };

  const getLoad = (loadId) => loadCache[loadId] || null;
  const bookedLoads = activeBookings.filter(b => ['booked', 'in_transit', 'delivered'].includes(b.status));

  const LOAD_STATUS_BADGE = {
    in_transit: { bg: '#0288d1', color: '#fff', label: 'In Transit' },
    delivered:  { bg: '#2e7d32', color: '#fff', label: 'Delivered' },
    booked:     { bg: '#ed6c02', color: '#fff', label: 'Booked' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Booking Requests</h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Manage carrier booking requests and bids on your loads</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ion-border-color)' }}>
        <button style={tabBtnStyle(activeTab === 0)} onClick={() => setActiveTab(0)}>Book Now ({pendingBookings.length})</button>
        <button style={tabBtnStyle(activeTab === 1)} onClick={() => setActiveTab(1)}>Bids / Offers ({activeBids.filter(b => b.status === 'pending').length})</button>
        <button style={tabBtnStyle(activeTab === 2)} onClick={() => setActiveTab(2)}>Active Loads ({bookedLoads.length})</button>
      </div>

      {/* Bookings Tab */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ ...cardStyle, padding: 16 }}>
                  <SkeletonBox width="60%" height={20} />
                  <div style={{ height: 8 }} />
                  <SkeletonBox width="80%" height={16} />
                  <div style={{ height: 6 }} />
                  <SkeletonBox width="50%" height={16} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
          ) : pendingBookings.length === 0 ? (
            <div style={{ ...cardStyle, padding: '48px 0', textAlign: 'center' }}>
              <IonIcon name="time-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No pending booking requests</p>
            </div>
          ) : pendingBookings.map(booking => {
            const load = getLoad(booking.load_id);
            return (
              <div key={booking.id} style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
                      {load ? `${load.origin} → ${load.dest}` : `Load #${String(booking.load_id).slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>
                      {booking.carrier_name || 'Carrier'}{booking.carrier_mc ? ` · MC-${booking.carrier_mc}` : ''}
                    </span>
                    <Link
                      to={`/c/${booking.carrier_id?.slice(0,8)}`}
                      state={{ carrierId: booking.carrier_id }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}
                    >
                      View profile <IonIcon name="open-outline" style={{ fontSize: 11 }} />
                    </Link>
                  </div>
                  {load && <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{load.type} · ${load.rate?.toLocaleString()} · {load.miles} mi</p>}
                  {booking.note && <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--ion-color-medium)', fontStyle: 'italic' }}>"{booking.note}"</p>}
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{new Date(booking.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {statusBadge(booking.status)}
                  <button onClick={() => setReviewModal({ type: 'booking', item: booking })} style={{ padding: '6px 12px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bids Tab */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bidsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ ...cardStyle, padding: 16 }}>
                  <SkeletonBox width="60%" height={20} />
                  <div style={{ height: 8 }} />
                  <SkeletonBox width="80%" height={16} />
                  <div style={{ height: 6 }} />
                  <SkeletonBox width="50%" height={16} />
                </div>
              ))}
            </div>
          ) : activeBids.length === 0 ? (
            <div style={{ ...cardStyle, padding: '48px 0', textAlign: 'center' }}>
              <IonIcon name="cash-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No bids yet</p>
            </div>
          ) : activeBids.map(bid => {
            const diff = bid.load_rate ? ((bid.amount - bid.load_rate) / bid.load_rate * 100) : null;
            const isAbove = diff !== null && diff >= 0;
            const loadNum = String(bid.load_id).slice(0, 8).toUpperCase();
            return (
              <div key={bid.id} style={{ ...cardStyle, overflow: 'hidden' }}>
                <Link
                  to={`/broker/loads/${bid.load_id}`}
                  state={{ from: 'Booking Requests' }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'var(--ion-color-light)', borderBottom: '1px solid var(--ion-border-color)', textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: 'var(--ion-color-medium)', letterSpacing: '0.05em' }}>#{loadNum}</span>
                    {bid.load_origin && bid.load_dest ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{bid.load_origin}</span>
                        <IonIcon name="arrow-forward-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{bid.load_dest}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>Load #{loadNum}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {statusBadge(bid.status)}
                    <IonIcon name="open-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                  </div>
                </Link>

                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Bid Amount</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ion-color-primary)', lineHeight: 1.1 }}>${bid.amount.toLocaleString()}</span>
                        </div>
                        {bid.load_rate && (
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Listed Rate</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-color-medium)', lineHeight: 1.1 }}>${bid.load_rate.toLocaleString()}</span>
                          </div>
                        )}
                        {diff !== null && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${isAbove ? '#2e7d32' : '#ed6c02'}`, color: isAbove ? '#2e7d32' : '#ed6c02' }}>
                            <IonIcon name={isAbove ? 'trending-up-outline' : 'trending-down-outline'} style={{ fontSize: 12 }} />
                            {isAbove ? '+' : ''}{diff.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: bid.note || bid.counter_amount ? 8 : 0 }}>
                        <IonIcon name="person-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                        {bid.carrier_id ? (
                          <Link to={`/c/${bid.carrier_id?.slice(0, 8)}`} state={{ carrierId: bid.carrier_id }} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-color-primary)', textDecoration: 'none' }}>
                            {bid.carrier_name || 'Carrier'}
                          </Link>
                        ) : (
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{bid.carrier_name || 'Carrier'}</span>
                        )}
                        {bid.carrier_mc && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>MC-{bid.carrier_mc}</span>}
                      </div>

                      {bid.note && (
                        <div style={{ padding: '6px 12px', margin: '6px 0', backgroundColor: 'var(--ion-color-light)', border: '1px solid var(--ion-border-color)', borderRadius: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', fontStyle: 'italic' }}>"{bid.note}"</span>
                        </div>
                      )}

                      {bid.counter_amount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <IonIcon name="swap-horizontal-outline" style={{ fontSize: 13, color: '#0288d1' }} />
                          <span style={{ fontSize: '0.75rem', color: '#0288d1' }}>
                            Your counter: <strong>${bid.counter_amount.toLocaleString()}</strong>
                            {bid.counter_note && ` — ${bid.counter_note}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {bid.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 100 }}>
                        <button onClick={() => setBidModal({ bid, mode: 'accept' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '6px 10px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}>
                          <IonIcon name="checkmark-outline" style={{ fontSize: 14 }} /> Accept
                        </button>
                        <button onClick={() => { setBidModal({ bid, mode: 'counter' }); setCounterAmount(String(bid.load_rate || '')); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '6px 10px', backgroundColor: 'transparent', color: '#0288d1', border: '1px solid #0288d1', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}>
                          <IonIcon name="swap-horizontal-outline" style={{ fontSize: 14 }} /> Counter
                        </button>
                        <button onClick={() => setBidModal({ bid, mode: 'reject' })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '6px 10px', backgroundColor: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}>
                          <IonIcon name="close-outline" style={{ fontSize: 14 }} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Loads Tab */}
      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookedLoads.length === 0 ? (
            <div style={{ ...cardStyle, padding: '48px 0', textAlign: 'center' }}>
              <IonIcon name="cash-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No active or completed loads</p>
            </div>
          ) : bookedLoads.map(load => {
            const bookingId = load.booking_id;
            const ps = paymentStatuses[bookingId];
            const payStatus = ps?.status || 'unpaid';
            const isEscrowed = payStatus === 'escrowed';
            const isUnpaidOrPending = payStatus === 'unpaid' || payStatus === 'pending' || payStatus === 'failed';
            const lsBadge = LOAD_STATUS_BADGE[load.status] || { bg: '#ed6c02', color: '#fff', label: load.status };
            return (
              <div key={load.id} style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{load.origin} → {load.destination}</span>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: lsBadge.bg, color: lsBadge.color }}>{lsBadge.label}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>
                    {load.load_type} · ${load.rate?.toLocaleString()} · {load.miles} mi{load.carrier_name ? ` · ${load.carrier_name}` : ''}
                  </p>
                  {ps && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {paymentBadge(payStatus)}
                      {ps.carrier_amount && payStatus !== 'unpaid' && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Carrier receives: ${ps.carrier_amount?.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {bookingId && isUnpaidOrPending && (
                    <button onClick={() => setPaymentDialog(bookingId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600 }}>
                      <IonIcon name="lock-closed-outline" style={{ fontSize: 14 }} /> Pay Escrow
                    </button>
                  )}
                  {bookingId && isEscrowed && (
                    <button onClick={() => handleRelease(bookingId)} disabled={releasing[bookingId]} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: releasing[bookingId] ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, opacity: releasing[bookingId] ? 0.7 : 1 }}>
                      {releasing[bookingId] ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="checkmark-outline" style={{ fontSize: 14 }} />}
                      {releasing[bookingId] ? 'Releasing…' : 'Release Payment'}
                    </button>
                  )}
                  {payStatus === 'released' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: '#2e7d32', color: '#fff' }}>
                      <IonIcon name="checkmark-outline" style={{ fontSize: 11 }} /> Paid Out
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking review modal */}
      {reviewModal && reviewModal.type === 'booking' && (
        <IonModal isOpen onDidDismiss={() => setReviewModal(null)} style={{ '--width': '480px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Review Booking Request</span>
              <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                <IonIcon name="close-outline" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                  {(() => { const load = getLoad(reviewModal.item.load_id); return load ? `${load.origin} → ${load.dest}` : ''; })()}
                </span>
                <Link
                  to={`/c/${reviewModal.item.carrier_id?.slice(0,8)}`}
                  state={{ carrierId: reviewModal.item.carrier_id }}
                  onClick={() => setReviewModal(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}
                >
                  Carrier profile <IonIcon name="open-outline" style={{ fontSize: 11 }} />
                </Link>
              </div>
              {reviewModal.item.note && (
                <div style={{ padding: '12px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Carrier note:</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>"{reviewModal.item.note}"</p>
                </div>
              )}
              <div>
                <label style={labelStyle}>Note to carrier (optional)</label>
                <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} placeholder="Add a message..." value={brokerNote} onChange={e => setBrokerNote(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setReviewModal(null)} style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-color-medium)' }}>Cancel</button>
              <button onClick={() => handleReviewBooking(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}>
                <IonIcon name="close-outline" style={{ fontSize: 14 }} /> Deny
              </button>
              <button onClick={() => handleReviewBooking(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}>
                <IonIcon name="checkmark-outline" style={{ fontSize: 14 }} /> Approve
              </button>
            </div>
          </div>
        </IonModal>
      )}

      {/* Bid action modal */}
      {bidModal && (
        <IonModal isOpen onDidDismiss={() => setBidModal(null)} style={{ '--width': '480px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>
                {bidModal.mode === 'counter' ? 'Counter Offer' : bidModal.mode === 'accept' ? 'Accept Bid?' : 'Reject Bid?'}
              </span>
              <button onClick={() => setBidModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                <IonIcon name="close-outline" style={{ fontSize: 20 }} />
              </button>
            </div>

            {bidModal.mode === 'counter' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                  Carrier bid <strong>${bidModal.bid.amount.toLocaleString()}</strong>
                  {bidModal.bid.load_rate && <> · Listed at <strong>${bidModal.bid.load_rate.toLocaleString()}</strong></>}
                </p>
                <div>
                  <label style={labelStyle}>Your counter amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>$</span>
                    <input style={{ ...inputStyle, paddingLeft: 24 }} type="number" value={counterAmount} onChange={e => setCounterAmount(e.target.value)} autoFocus />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Note to carrier (optional)</label>
                  <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={counterNote} onChange={e => setCounterNote(e.target.value)} placeholder="Explain your counter offer..." />
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                {bidModal.mode === 'accept'
                  ? <>Accept <strong>${bidModal.bid.amount.toLocaleString()}</strong> from {bidModal.bid.carrier_name || 'this carrier'}?</>
                  : <>Reject <strong>${bidModal.bid.amount.toLocaleString()}</strong> from {bidModal.bid.carrier_name || 'this carrier'}?</>
                }
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setBidModal(null)} style={{ padding: '8px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
              {bidModal.mode === 'counter' ? (
                <button onClick={handleBidAction} disabled={!counterAmount || bidActing} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: '#0288d1', color: '#fff', border: 'none', borderRadius: 6, cursor: (!counterAmount || bidActing) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: (!counterAmount || bidActing) ? 0.7 : 1 }}>
                  {bidActing && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
                  {bidActing ? 'Sending…' : 'Send Counter'}
                </button>
              ) : (
                <button onClick={handleBidAction} disabled={bidActing} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: bidModal.mode === 'accept' ? '#2e7d32' : '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, cursor: bidActing ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: bidActing ? 0.7 : 1 }}>
                  {bidActing
                    ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />
                    : bidModal.mode === 'accept' ? <IonIcon name="checkmark-outline" style={{ fontSize: 14 }} /> : <IonIcon name="close-outline" style={{ fontSize: 14 }} />
                  }
                  {bidActing ? 'Processing…' : bidModal.mode === 'accept' ? 'Accept' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </IonModal>
      )}

      {paymentDialog && (
        <PaymentDialog
          bookingId={paymentDialog}
          onClose={() => setPaymentDialog(null)}
          onPaid={() => handlePaymentSuccess(paymentDialog)}
        />
      )}
    </div>
  );
}
