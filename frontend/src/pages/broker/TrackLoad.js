import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, locationsApi } from '../../services/api';
import {
  Box, Typography, Button, Card, CardContent, CircularProgress, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceIcon from '@mui/icons-material/Place';
import NavigationIcon from '@mui/icons-material/Navigation';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Ensure ISO string is treated as UTC even if it lacks a Z suffix
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

  // Reverse-geocode coords to a readable city if the API didn't provide one
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
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error && !booking) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{error}</Typography>
      <Button variant="text" onClick={() => navigate(-1)}>Go back</Button>
    </Box>
  );

  const isInTransit = booking?.status === 'in_transit';

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={() => navigate('/broker/active')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Active Loads
      </Button>

      {/* Load summary */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <NavigationIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography variant="subtitle1" fontWeight={700}>Locate Load</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{load?.origin} → {load?.destination}</Typography>
          <Typography variant="caption" color="text.secondary">
            {load?.miles} mi · {load?.commodity} · {booking?.carrier_name}
          </Typography>
        </CardContent>
      </Card>

      {/* Last known location */}
      {location?.available && (
        <Card sx={{ border: '1px solid', borderColor: 'success.main', bgcolor: 'rgba(46,125,50,0.04)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: 'rgba(46,125,50,0.1)', border: '1px solid',
                borderColor: 'success.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <PlaceIcon sx={{ color: 'success.main' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Last known location</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {booking?.carrier_name || 'Carrier'} is currently near
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {cityLabel || '…'}
                </Typography>
                {location.updated_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      Shared {timeAgo(location.updated_at)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            {location.lat && location.lng && (
              <Button
                component={Link}
                to={`/map/${location.lat}/${location.lng}/${encodeURIComponent(cityLabel || '')}/${encodeURIComponent(booking?.carrier_name || 'Carrier')}`}
                variant="contained"
                color="success"
                fullWidth
                startIcon={<PlaceIcon />}
              >
                View Map
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Locate / request section */}
      <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center' }}>
          {!isInTransit ? (
            <Box>
              <NavigationIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Location requests can only be sent once the load is in transit.
              </Typography>
            </Box>
          ) : requested ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: 'success.main' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Request Sent!</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {booking?.carrier_name || 'The carrier'} will receive a notification in messages to share their location.
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/broker/messages"
                variant="text"
                startIcon={<ChatBubbleOutlineIcon />}
                color="primary"
              >
                View in Messages
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box>
                <NavigationIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700}>Request Carrier Location</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Sends a message to {booking?.carrier_name || 'the carrier'} asking them to share their current location.
                  They'll see it in messages and can respond with one tap.
                </Typography>
              </Box>
              {error && (
                <Alert severity="error" icon={<WarningAmberIcon />} sx={{ width: '100%' }}>
                  {error}
                </Alert>
              )}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleLocate}
                disabled={requesting}
                startIcon={requesting ? <CircularProgress size={16} color="inherit" /> : <NavigationIcon />}
                sx={{ py: 1.5 }}
              >
                {requesting ? 'Sending…' : 'Locate Load'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Link to messages */}
      {!requested && (
        <Button
          component={Link}
          to="/broker/messages"
          variant="outlined"
          color="inherit"
          startIcon={<ChatBubbleOutlineIcon />}
          fullWidth
        >
          View Messages with Carrier
        </Button>
      )}
    </Box>
  );
}
