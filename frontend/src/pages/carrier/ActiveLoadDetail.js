import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Package, DollarSign,
  Truck, MessageSquare, CheckCircle, Navigation, Flag, Phone, Mail,
  AlertTriangle, Clock, ChevronRight
} from 'lucide-react';
import { bookingsApi, bidsApi, locationsApi } from '../../services/api';

const RouteMap = lazy(() => import('../../components/shared/RouteMap'));

const STEP_MAP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3 };
const STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];

function StatusTimeline({ status }) {
  const current = STEP_MAP[status] ?? 1;
  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${done   ? 'bg-brand-500' : ''}
                ${active ? 'bg-brand-500 ring-2 ring-brand-400/40 ring-offset-2 ring-offset-dark-900' : ''}
                ${!done && !active ? 'bg-dark-700 border border-dark-500' : ''}
              `}>
                {done   && <CheckCircle size={16} className="text-white" />}
                {active && <div className="w-3 h-3 rounded-full bg-white" />}
                {!done && !active && <div className="w-2 h-2 rounded-full bg-dark-500" />}
              </div>
              <span className={`text-xs mt-1.5 whitespace-nowrap font-medium ${
                active ? 'text-brand-400' : done ? 'text-brand-400/60' : 'text-dark-500'
              }`}>{step}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 ${done ? 'bg-brand-500' : 'border-t border-dashed border-dark-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatBox({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-dark-800/60 rounded-xl p-4 border border-dark-700/50">
      <p className="text-dark-400 text-xs mb-1">{label}</p>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
      {sub && <p className="text-dark-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ActiveLoadDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [myBid, setMyBid] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const load = booking?.load;

  // Map booking status → 4-step timeline label
  const timelineStatus =
    booking?.status === 'pending'    ? 'quoted'     :
    booking?.status === 'in_transit' ? 'in_transit' :
    booking?.status === 'completed'  ? 'delivered'  :
    'booked';

  useEffect(() => {
    bookingsApi.get(bookingId)
      .then(data => {
        setBooking(data);
        // Check for a bid on this load
        if (data?.load?.id) {
          bidsApi.my()
            .then(bids => setMyBid(bids.find(b => String(b.load_id) === String(data.load.id)) || null))
            .catch(() => {});
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Start/stop GPS tracking based on in_transit status
  useEffect(() => {
    if (booking?.status !== 'in_transit') return;
    if (!navigator.geolocation) return;

    const sendLocation = (pos) => {
      const now = Date.now();
      if (now - lastSentRef.current < 30000) return; // throttle to 30s
      lastSentRef.current = now;
      locationsApi.update(bookingId, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }).catch(() => {});
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { setTrackingActive(true); setLocationError(null); sendLocation(pos); },
      (err) => { setLocationError(err.message); setTrackingActive(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [booking?.status, bookingId]);

  const handlePickup = async () => {
    setActionLoading(true);
    try {
      await bookingsApi.pickup(bookingId);
      setBooking(b => ({ ...b, status: 'in_transit' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    setActionLoading(true);
    try {
      await bookingsApi.deliver(bookingId);
      setBooking(b => ({ ...b, status: 'completed' }));
      locationsApi.clear(bookingId).catch(() => {});
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (error || !booking) return (
    <div className="text-center py-20 space-y-3">
      <AlertTriangle size={32} className="text-red-400 mx-auto" />
      <p className="text-dark-300">{error || 'Booking not found.'}</p>
      <button onClick={() => navigate(-1)} className="text-brand-400 text-sm">Go back</button>
    </div>
  );

  const netProfit = load ? (load.rate || 0) - (load.fuel_cost_est || 0) - Math.round((load.deadhead_miles || 0) * 0.62) - 120 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/carrier/active')} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Active Loads
      </button>

      {/* Header */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge-blue flex items-center gap-1">
                <Truck size={10} /> {load?.load_type?.replace('_', ' ') || 'Load'}
              </span>
              <span className="text-dark-400 text-xs">Booking #{bookingId.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {load?.origin} → {load?.destination}
            </h1>
            <p className="text-dark-300 text-sm mt-1">
              {load?.commodity} · {load?.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : ''} · {load?.miles} loaded miles
            </p>
          </div>
          {/* Message broker */}
          {load?.broker_user_id && (
            <Link
              to={`/carrier/messages?userId=${load.broker_user_id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-400/40 text-dark-200 hover:text-white hover:border-dark-300 text-sm transition-colors"
            >
              <MessageSquare size={15} /> Message Broker
            </Link>
          )}
        </div>

        {/* Timeline */}
        <StatusTimeline status={timelineStatus} />

        {/* Live tracking status */}
        {booking?.status === 'in_transit' && (
          <div className={`mt-5 rounded-xl border px-4 py-3 flex items-center gap-3 ${
            trackingActive
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : locationError
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-dark-700/50 border-dark-500/30'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              trackingActive ? 'bg-emerald-400 animate-pulse' : locationError ? 'bg-red-400' : 'bg-dark-400'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${trackingActive ? 'text-emerald-400' : locationError ? 'text-red-400' : 'text-dark-300'}`}>
                {trackingActive ? 'Sharing live location with broker' : locationError ? 'Location access denied' : 'Starting GPS…'}
              </p>
              <p className="text-dark-500 text-xs mt-0.5">
                {trackingActive
                  ? 'Broker can see your position in real time. Keep this page open.'
                  : locationError
                  ? 'Allow location access in your browser to share tracking.'
                  : 'Waiting for GPS signal…'}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6">
          {booking.status === 'approved' && (
            <button
              onClick={handlePickup}
              disabled={actionLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors shadow-lg shadow-brand-500/20"
            >
              {actionLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Navigation size={16} />
              }
              Confirm Pickup — Mark as In Transit
            </button>
          )}

          {booking.status === 'in_transit' && (
            <button
              onClick={handleDeliver}
              disabled={actionLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white transition-colors shadow-lg shadow-emerald-500/20"
            >
              {actionLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Flag size={16} />
              }
              Confirm Delivery — Mark as Delivered
            </button>
          )}

          {booking.status === 'completed' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-400 font-semibold">Load Delivered</p>
                <p className="text-emerald-300/70 text-sm">This load has been completed.</p>
              </div>
            </div>
          )}

          {booking.status === 'pending' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
              <Clock size={20} className="text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 font-semibold">Awaiting Broker Approval</p>
                <p className="text-yellow-300/70 text-sm">The broker hasn't confirmed your booking request yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left — load details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Route */}
          <div className="glass rounded-xl p-6 border border-dark-400/40">
            <h2 className="text-white font-semibold mb-5">Route Details</h2>
            <div className="space-y-4 mb-5">
              {[
                { label: 'Pickup', value: load?.origin, sub: load?.pickup_date, color: 'text-brand-400' },
                { label: 'Delivery', value: load?.destination, sub: load?.delivery_date, color: 'text-red-400' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                    <MapPin size={15} className={color} />
                  </div>
                  <div>
                    <p className="text-dark-400 text-xs">{label}</p>
                    <p className="text-white font-medium">{value}</p>
                    {sub && <p className="text-dark-400 text-xs flex items-center gap-1"><Calendar size={9} />{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-dark-700/50 mb-5">
              <StatBox label="Loaded Miles" value={`${load?.miles || 0} mi`} />
              <StatBox label="Deadhead" value={`${load?.deadhead_miles || 0} mi`} />
              <StatBox label="Dimensions" value={load?.dimensions || '48x102'} />
            </div>

            {load?.origin && load?.destination && (
              <Suspense fallback={<div className="h-56 rounded-lg bg-dark-700/50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>}>
                <RouteMap origin={load.origin} dest={load.destination} miles={load.miles} />
              </Suspense>
            )}
          </div>

          {/* Profit breakdown */}
          <div className="glass rounded-xl p-6 border border-dark-400/40">
            <h2 className="text-white font-semibold mb-4">Profit Breakdown</h2>
            <div className="space-y-3 mb-4">
              {[
                { label: 'Gross Rate', value: `+$${(load?.rate || 0).toLocaleString()}`, cls: 'text-brand-400' },
                { label: `Fuel (~${load?.miles || 0} mi)`, value: `-$${load?.fuel_cost_est || 0}`, cls: 'text-red-400' },
                { label: `Deadhead (${load?.deadhead_miles || 0} mi)`, value: `-$${Math.round((load?.deadhead_miles || 0) * 0.62)}`, cls: 'text-red-400' },
                { label: 'Misc / tolls', value: '-$120', cls: 'text-red-400' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-dark-700/40">
                  <span className="text-dark-300 text-sm">{label}</span>
                  <span className={`font-semibold text-sm ${cls}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-white font-bold">Est. Net Profit</span>
                <span className={`text-xl font-black ${netProfit > 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(booking.note || booking.broker_note || load?.notes) && (
            <div className="glass rounded-xl p-6 border border-dark-400/40">
              <h2 className="text-white font-semibold mb-4">Notes</h2>
              <div className="space-y-3">
                {load?.notes && (
                  <div>
                    <p className="text-dark-400 text-xs mb-1">Load Instructions</p>
                    <p className="text-dark-200 text-sm">{load.notes}</p>
                  </div>
                )}
                {booking.note && (
                  <div>
                    <p className="text-dark-400 text-xs mb-1">Your Note</p>
                    <p className="text-dark-200 text-sm">{booking.note}</p>
                  </div>
                )}
                {booking.broker_note && (
                  <div>
                    <p className="text-dark-400 text-xs mb-1">Broker Note</p>
                    <p className="text-dark-200 text-sm">{booking.broker_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — broker + stats */}
        <div className="space-y-5">
          {/* Rate summary */}
          <div className="glass rounded-xl p-5 border border-dark-400/40 space-y-3">
            <h2 className="text-white font-semibold text-sm">Rate Summary</h2>
            {[
              { label: 'Agreed Rate', value: `$${(load?.rate || 0).toLocaleString()}`, color: 'text-brand-400' },
              { label: 'Per Mile', value: `$${(load?.rate_per_mile || 0).toFixed(2)}` },
              { label: 'Commodity', value: load?.commodity || '—' },
              { label: 'Weight', value: load?.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : '—' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-dark-400">{label}</span>
                <span className={`font-semibold ${color || 'text-white'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Broker info */}
          {load?.broker_name && (
            <div className="glass rounded-xl p-5 border border-dark-400/40">
              <h2 className="text-white font-semibold text-sm mb-3">Broker</h2>
              <div className="space-y-2">
                <p className="text-white font-medium">{load.broker_name}</p>
                {load.broker_mc && <p className="text-dark-400 text-xs">MC# {load.broker_mc}</p>}
                {load.broker_email && (
                  <a href={`mailto:${load.broker_email}`} className="flex items-center gap-2 text-brand-400 text-sm hover:text-brand-300 transition-colors mt-2">
                    <Mail size={13} /> {load.broker_email}
                  </a>
                )}
                {load.broker_phone && (
                  <a href={`tel:${load.broker_phone}`} className="flex items-center gap-2 text-brand-400 text-sm hover:text-brand-300 transition-colors mt-1">
                    <Phone size={13} /> {load.broker_phone}
                  </a>
                )}
              </div>
              {load.broker_user_id && (
                <Link
                  to={`/carrier/messages?userId=${load.broker_user_id}`}
                  className="mt-3 w-full py-2 rounded-lg border border-dark-500 text-dark-200 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare size={13} /> Open Messages <ChevronRight size={13} />
                </Link>
              )}
            </div>
          )}

          {/* Bid status (if carrier bid on this load) */}
          {myBid && (
            <div className={`glass rounded-xl p-5 border ${
              myBid.status === 'accepted'  ? 'border-brand-500/30' :
              myBid.status === 'countered' ? 'border-blue-500/30' :
              myBid.status === 'rejected'  ? 'border-red-500/30' :
              'border-dark-400/40'
            }`}>
              <h2 className="text-white font-semibold text-sm mb-3">Your Bid</h2>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${
                  myBid.status === 'accepted'  ? 'text-brand-400' :
                  myBid.status === 'countered' ? 'text-blue-400' :
                  myBid.status === 'rejected'  ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {myBid.status === 'accepted'  ? 'Accepted' :
                   myBid.status === 'countered' ? 'Countered' :
                   myBid.status === 'rejected'  ? 'Rejected' : 'Pending'}
                </span>
                <span className="text-white font-bold">${myBid.amount?.toLocaleString()}</span>
              </div>
              {myBid.status === 'countered' && myBid.counter_amount && (
                <div className="bg-blue-500/10 rounded-lg p-3 text-sm">
                  <p className="text-blue-300 text-xs mb-1">Broker counter offer</p>
                  <p className="text-white font-bold">${myBid.counter_amount.toLocaleString()}</p>
                  {myBid.counter_note && <p className="text-blue-300/70 text-xs mt-1">"{myBid.counter_note}"</p>}
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="glass rounded-xl p-5 border border-dark-400/40 space-y-2">
            <h2 className="text-white font-semibold text-sm mb-3">Quick Actions</h2>
            <Link
              to="/carrier/loads"
              className="w-full py-2.5 rounded-xl border border-dark-500 text-dark-200 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Package size={14} /> Browse More Loads
            </Link>
            <Link
              to="/carrier/active"
              className="w-full py-2.5 rounded-xl border border-dark-500 text-dark-200 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <DollarSign size={14} /> All Active Loads
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
