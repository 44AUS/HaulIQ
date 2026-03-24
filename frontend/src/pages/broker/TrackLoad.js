import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, AlertTriangle, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { bookingsApi, locationsApi } from '../../services/api';

function timeAgo(iso) {
  if (!iso) return null;
  const s = Math.round((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function TrackLoad() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState(null);

  const load = booking?.load;

  useEffect(() => {
    Promise.all([
      bookingsApi.get(bookingId),
      locationsApi.get(bookingId).catch(() => ({ available: false })),
    ])
      .then(([bk, loc]) => { setBooking(bk); setLocation(loc); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleLocate = async () => {
    setRequesting(true);
    setError(null);
    try {
      await locationsApi.request(bookingId);
      setRequested(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (error && !booking) return (
    <div className="text-center py-20 space-y-3">
      <AlertTriangle size={32} className="text-red-400 mx-auto" />
      <p className="text-dark-300">{error}</p>
      <button onClick={() => navigate(-1)} className="text-brand-400 text-sm">Go back</button>
    </div>
  );

  const isInTransit = booking?.status === 'in_transit';

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <button onClick={() => navigate('/broker/active')} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Active Loads
      </button>

      {/* Load summary */}
      <div className="glass rounded-xl p-5 border border-dark-400/40">
        <div className="flex items-center gap-2 mb-1">
          <Navigation size={15} className="text-brand-400" />
          <h1 className="text-white font-bold">Locate Load</h1>
        </div>
        <p className="text-dark-400 text-sm">{load?.origin} → {load?.destination}</p>
        <p className="text-dark-500 text-xs mt-0.5">{load?.miles} mi · {load?.commodity} · {booking?.carrier_name}</p>
      </div>

      {/* Last known location */}
      {location?.available && (
        <div className="glass rounded-xl p-5 border border-emerald-500/30">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-dark-400 text-xs mb-0.5">Last known location</p>
              <p className="text-white font-semibold">
                {booking?.carrier_name || 'Carrier'} is currently near
              </p>
              <p className="text-emerald-400 font-bold text-lg">
                {location.city || `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`}
              </p>
              {location.updated_at && (
                <p className="text-dark-500 text-xs mt-1 flex items-center gap-1">
                  <Clock size={10} /> Shared {timeAgo(location.updated_at)}
                </p>
              )}
            </div>
          </div>
          {location.lat && location.lng && (
            <Link
              to={`/map/${location.lat}/${location.lng}/${encodeURIComponent(location.city || '')}/${encodeURIComponent(booking?.carrier_name || 'Carrier')}`}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin size={14} /> View Map
            </Link>
          )}
        </div>
      )}

      {/* Locate button */}
      <div className="glass rounded-xl p-6 border border-dark-400/40 text-center space-y-4">
        {!isInTransit ? (
          <div className="space-y-2">
            <Navigation size={32} className="text-dark-500 mx-auto" />
            <p className="text-dark-400 text-sm">Location requests can only be sent once the load is in transit.</p>
          </div>
        ) : requested ? (
          <div className="space-y-3">
            <CheckCircle size={36} className="text-brand-400 mx-auto" />
            <div>
              <p className="text-white font-semibold">Request Sent!</p>
              <p className="text-dark-400 text-sm mt-1">
                {booking?.carrier_name || 'The carrier'} will receive a notification in messages to share their location.
              </p>
            </div>
            <Link
              to="/broker/messages"
              className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm transition-colors"
            >
              <MessageSquare size={14} /> View in Messages
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Navigation size={32} className="text-dark-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Request Carrier Location</p>
              <p className="text-dark-400 text-sm mt-1 leading-relaxed">
                Sends a message to {booking?.carrier_name || 'the carrier'} asking them to share their current location. They'll see it in messages and can respond with one tap.
              </p>
            </div>
            {error && (
              <p className="text-red-400 text-sm flex items-center justify-center gap-1.5">
                <AlertTriangle size={13} /> {error}
              </p>
            )}
            <button
              onClick={handleLocate}
              disabled={requesting}
              className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-500/20"
            >
              {requesting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Navigation size={16} /> Locate Load</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Link to messages */}
      {!requested && (
        <Link
          to="/broker/messages"
          className="w-full py-2.5 rounded-xl border border-dark-500 text-dark-300 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare size={14} /> View Messages with Carrier
        </Link>
      )}
    </div>
  );
}
