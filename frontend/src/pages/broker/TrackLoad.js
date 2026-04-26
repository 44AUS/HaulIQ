import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { bookingsApi, locationsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };

function toUtc(iso) {
  if (!iso) return null;
  return iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
}

function timeAgo(iso) {
  if (!iso) return null;
  const s = Math.round((Date.now() - toUtc(iso)) / 1000);
  if (s < 5)    return 'just now';
  if (s < 60)   return `${s} sec ago`;
  if (s < 120)  return '1 min ago';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 7200) return '1 hr ago';
  if (s < 86400) return `${Math.floor(s / 3600)} hrs ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const state = addr.state || '';
    return city && state ? `${city}, ${state}` : city || state || null;
  } catch {
    return null;
  }
}

export default function TrackLoad() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [location, setLocation] = useState(null);
  const [cityLabel, setCityLabel] = useState('');
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

  useEffect(() => {
    if (!location?.available) return;
    if (location.city) { setCityLabel(location.city); return; }
    if (!location.lat || !location.lng) return;
    reverseGeocode(location.lat, location.lng).then(label => {
      setCityLabel(label || `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`);
    });
  }, [location]);

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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><IonSpinner name="crescent" /></div>
  );

  if (error && !booking) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <IonIcon name="warning-outline" style={{ fontSize: 40, color: '#d32f2f', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontSize: '0.875rem', fontFamily: 'inherit' }}>Go back</button>
    </div>
  );

  const isInTransit = booking?.status === 'in_transit';

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button
        onClick={() => navigate('/broker/active')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontSize: '0.875rem', fontFamily: 'inherit', alignSelf: 'flex-start', padding: 0 }}
      >
        <IonIcon name="arrow-back-outline" style={{ fontSize: 16 }} /> Back to Active Loads
      </button>

      {/* Load summary */}
      <div style={cardStyle}>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <IonIcon name="navigate-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Locate Load</span>
          </div>
          <p style={{ margin: '0 0 2px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{load?.origin} → {load?.destination}</p>
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
            {load?.miles} mi · {load?.commodity} · {booking?.carrier_name}
          </span>
        </div>
      </div>

      {/* Last known location */}
      {location?.available && (
        <div style={{ ...cardStyle, border: '1px solid #2e7d32', backgroundColor: 'rgba(46,125,50,0.04)' }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(46,125,50,0.1)', border: '1px solid #2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IonIcon name="location-outline" style={{ color: '#2e7d32' }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>Last known location</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block' }}>
                  {booking?.carrier_name || 'Carrier'} is currently near
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2e7d32', display: 'block' }}>{cityLabel || '…'}</span>
                {location.updated_at && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                    <IonIcon name="time-outline" style={{ fontSize: 12 }} /> Shared {timeAgo(location.updated_at)}
                  </span>
                )}
              </div>
            </div>
            {location.lat && location.lng && (
              <Link
                to={`/map/${location.lat}/${location.lng}/${encodeURIComponent(cityLabel || '')}/${encodeURIComponent(booking?.carrier_name || 'Carrier')}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', backgroundColor: '#2e7d32', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
              >
                <IonIcon name="location-outline" style={{ fontSize: 16 }} /> View Map
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Locate / request section */}
      <div style={cardStyle}>
        <div style={{ padding: 16, textAlign: 'center' }}>
          {!isInTransit ? (
            <div>
              <IonIcon name="navigate-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                Location requests can only be sent once the load is in transit.
              </p>
            </div>
          ) : requested ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <IonIcon name="checkmark-circle" style={{ fontSize: 44, color: '#2e7d32', display: 'block' }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Request Sent!</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                  {booking?.carrier_name || 'The carrier'} will receive a notification in messages to share their location.
                </p>
              </div>
              <Link
                to="/broker/messages"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ion-color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} /> View in Messages
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div>
                <IonIcon name="navigate-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Request Carrier Location</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                  Sends a message to {booking?.carrier_name || 'the carrier'} asking them to share their current location.
                  They'll see it in messages and can respond with one tap.
                </p>
              </div>
              {error && (
                <div style={{ width: '100%', padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon name="warning-outline" style={{ fontSize: 16 }} /> {error}
                </div>
              )}
              <button
                onClick={handleLocate}
                disabled={requesting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 0', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: requesting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: requesting ? 0.7 : 1 }}
              >
                {requesting ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : <IonIcon name="navigate-outline" style={{ fontSize: 16 }} />}
                {requesting ? 'Sending…' : 'Locate Load'}
              </button>
            </div>
          )}
        </div>
      </div>

      {!requested && (
        <Link
          to="/broker/messages"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
        >
          <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} /> View Messages with Carrier
        </Link>
      )}
    </div>
  );
}
