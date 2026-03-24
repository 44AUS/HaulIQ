import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, RefreshCw, AlertTriangle, Clock, User, MessageSquare } from 'lucide-react';
import { bookingsApi, locationsApi } from '../../services/api';

const LiveTrackingMap = lazy(() => import('../../components/shared/LiveTrackingMap'));

async function geocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function secondsAgo(isoStr) {
  if (!isoStr) return null;
  return Math.round((Date.now() - new Date(isoStr)) / 1000);
}

function freshnessLabel(isoStr) {
  const s = secondsAgo(isoStr);
  if (s == null) return null;
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export default function TrackLoad() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [location, setLocation] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [freshness, setFreshness] = useState(null);

  const load = booking?.load;

  const fetchLocation = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const loc = await locationsApi.get(bookingId);
      setLocation(loc);
      setFreshness(loc.updated_at || null);
    } catch {
      setLocation({ available: false });
    } finally {
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    Promise.all([
      bookingsApi.get(bookingId),
      locationsApi.get(bookingId),
    ])
      .then(([bk, loc]) => {
        setBooking(bk);
        setLocation(loc);
        setFreshness(loc.updated_at || null);
        // Geocode origin/dest for the map
        if (bk?.load?.origin)      geocode(bk.load.origin).then(setOriginCoords);
        if (bk?.load?.destination) geocode(bk.load.destination).then(setDestCoords);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchLocation(true), 30000);
    return () => clearInterval(interval);
  }, [fetchLocation]);

  // Keep freshness label ticking
  useEffect(() => {
    const t = setInterval(() => setFreshness(f => f), 10000);
    return () => clearInterval(t);
  }, []);

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

  const isInTransit = booking.status === 'in_transit';
  const isDelivered = booking.status === 'completed';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/broker/active')} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Active Loads
      </button>

      {/* Header */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Navigation size={16} className="text-brand-400" />
              <h1 className="text-xl font-bold text-white">
                {load?.origin} → {load?.destination}
              </h1>
            </div>
            <p className="text-dark-400 text-sm">
              {load?.miles} mi · {load?.commodity || 'Load'} · ${(load?.rate || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isInTransit && (
              <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-brand-400 text-xs font-semibold">In Transit</span>
              </div>
            )}
            {isDelivered && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
                <span className="text-emerald-400 text-xs font-semibold">Delivered</span>
              </div>
            )}
            <button
              onClick={() => fetchLocation()}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Map — takes 2 cols */}
        <div className="lg:col-span-2 glass rounded-xl p-5 border border-dark-400/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Live Location</h2>
            {freshness && (
              <span className="text-dark-400 text-xs flex items-center gap-1">
                <Clock size={11} /> Updated {freshnessLabel(freshness)}
              </span>
            )}
          </div>

          {!isInTransit && !isDelivered && (
            <div className="h-56 rounded-xl bg-dark-800/50 border border-dark-700/50 flex items-center justify-center">
              <div className="text-center">
                <Navigation size={28} className="text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400 text-sm">Tracking starts when carrier confirms pickup</p>
              </div>
            </div>
          )}

          {isDelivered && (
            <div className="h-56 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
              <div className="text-center">
                <p className="text-emerald-400 font-semibold mb-1">Load Delivered</p>
                <p className="text-dark-400 text-sm">Tracking has ended.</p>
              </div>
            </div>
          )}

          {isInTransit && !location?.available && (
            <div className="h-56 rounded-xl bg-dark-800/50 border border-dark-700/50 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 text-sm">Waiting for carrier GPS signal…</p>
                <p className="text-dark-500 text-xs">Updates every 30 seconds once carrier shares location</p>
              </div>
            </div>
          )}

          {isInTransit && location?.available && (
            <Suspense fallback={
              <div className="h-[280px] rounded-xl bg-dark-700/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            }>
              <LiveTrackingMap
                carrierLat={location.lat}
                carrierLng={location.lng}
                originCoords={originCoords}
                destCoords={destCoords}
                updatedAt={location.updated_at}
              />
            </Suspense>
          )}

          {isInTransit && location?.available && (
            <div className="mt-3 flex items-center gap-4 text-xs text-dark-400">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" /> Carrier position
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" /> Pickup
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" /> Delivery
              </span>
              {location.accuracy && (
                <span className="ml-auto">±{Math.round(location.accuracy)}m accuracy</span>
              )}
            </div>
          )}
        </div>

        {/* Right — carrier info */}
        <div className="space-y-4">
          {/* Route summary */}
          <div className="glass rounded-xl p-5 border border-dark-400/40 space-y-3">
            <h2 className="text-white font-semibold text-sm">Route</h2>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-dark-400 text-xs">Pickup</p>
                <p className="text-white text-sm font-medium">{load?.origin}</p>
                {load?.pickup_date && <p className="text-dark-500 text-xs">{load.pickup_date}</p>}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-dark-400 text-xs">Delivery</p>
                <p className="text-white text-sm font-medium">{load?.destination}</p>
                {load?.delivery_date && <p className="text-dark-500 text-xs">{load.delivery_date}</p>}
              </div>
            </div>
          </div>

          {/* Carrier */}
          {booking.carrier_name && (
            <div className="glass rounded-xl p-5 border border-dark-400/40">
              <h2 className="text-white font-semibold text-sm mb-3">Carrier</h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <User size={14} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{booking.carrier_name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  to={`/broker/messages?userId=${booking.load?.broker_user_id || ''}`}
                  className="w-full py-2 rounded-lg border border-dark-500 text-dark-200 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare size={13} /> Message Carrier
                </Link>
              </div>
            </div>
          )}

          {/* Refresh note */}
          <div className="glass rounded-xl p-4 border border-dark-500/30">
            <p className="text-dark-400 text-xs leading-relaxed">
              Location updates automatically every 30 seconds while the carrier has the app open.
              Hit Refresh to check for the latest position immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
