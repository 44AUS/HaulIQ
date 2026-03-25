import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, IconButton, TextField, Alert, Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MessageIcon from '@mui/icons-material/Message';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BoltIcon from '@mui/icons-material/Bolt';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { loadsApi, messagesApi, bidsApi, bookingsApi, instantBookApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import ProfitBadge from '../../components/shared/ProfitBadge';
import BrokerRating from '../../components/shared/BrokerRating';
import DocumentPanel from '../../components/documents/DocumentPanel';
import DescriptionIcon from '@mui/icons-material/Description';

const RouteMap = lazy(() => import('../../components/shared/RouteMap'));

export default function LoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [canInstantBook, setCanInstantBook] = useState(false);

  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [myBid, setMyBid] = useState(null);

  useEffect(() => {
    setLoading(true);
    loadsApi.get(id)
      .then(data => {
        const adapted = adaptLoad(data);
        setLoad(adapted);
        setSaved(adapted?.saved || false);
        instantBookApi.check(data.id)
          .then(res => setCanInstantBook(res.eligible === true))
          .catch(() => setCanInstantBook(false));
        bidsApi.my()
          .then(all => setMyBid(all.find(b => String(b.load_id) === String(data.id)) || null))
          .catch(() => {});
      })
      .catch(() => setLoad(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (!load) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary" gutterBottom>Load not found.</Typography>
      <Button component={Link} to="/carrier/loads" variant="text">Back to Load Board</Button>
    </Box>
  );

  const fuelCostEst = load.fuel;
  const deadheadCost = Math.round(load.deadhead * 0.62);
  const grossRevenue = load.rate;
  const expenses = fuelCostEst + deadheadCost + 120;
  const netProfit = grossRevenue - expenses;

  const handleInstantBook = () => {
    bookingsApi.request({ load_id: load._raw.id, is_instant: true })
      .then(() => setBookingStatus('instant_booked'))
      .catch(err => alert(err.message));
  };

  const handleBookNow = () => {
    bookingsApi.request({ load_id: load._raw.id, is_instant: false })
      .then(() => setBookingStatus('pending'))
      .catch(err => alert(err.message));
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const brokerUserId = load._raw?.broker_user_id;
    if (!brokerUserId) return;
    messagesApi.send(load._raw.id, brokerUserId, messageText.trim())
      .catch(() => {});
    setMessageText('');
    setMessageOpen(false);
  };

  const getBidStatusColor = (status) => {
    if (status === 'accepted') return 'success';
    if (status === 'countered') return 'info';
    if (status === 'rejected') return 'error';
    return 'warning';
  };

  const getBidStatusLabel = (status) => {
    if (status === 'accepted') return 'Bid Accepted!';
    if (status === 'countered') return 'Broker Countered';
    if (status === 'rejected') return 'Bid Rejected';
    return 'Bid Pending';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={() => navigate(-1)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Load Board
      </Button>

      {/* Load header */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {load.hot && (
                  <Chip label="Hot Load" size="small" color="error" />
                )}
                {load.instantBook && (
                  <Chip icon={<BoltIcon />} label="Instant Book" size="small" color="success" variant="outlined" />
                )}
                <Chip icon={<LocalShippingIcon />} label={load.type} size="small" color="primary" variant="outlined" />
                <Typography variant="caption" color="text.secondary">{load.posted}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {load.origin} → {load.dest}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {load.commodity} · {load.weight} · {load.miles} loaded miles
              </Typography>
            </Box>
            <IconButton
              onClick={() => { loadsApi.toggleSave(load._raw.id).catch(() => {}); setSaved(s => !s); }}
              color={saved ? 'primary' : 'default'}
              sx={{ border: '1px solid', borderColor: saved ? 'primary.main' : 'divider' }}
            >
              {saved ? <BookmarkAddedIcon /> : <BookmarkIcon />}
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Route details */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Route Details</Typography>
                <Stack spacing={2}>
                  {[
                    { label: 'Pickup', value: load.origin, fullAddress: load.pickupAddress, sub: load.pickup, color: 'primary.main' },
                    { label: 'Delivery', value: load.dest, fullAddress: load.deliveryAddress, sub: load.delivery, color: 'error.main' },
                  ].map(({ label, value, fullAddress, sub, color }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <LocationOnIcon sx={{ fontSize: 18, color }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{fullAddress || value}</Typography>
                        {fullAddress && fullAddress !== value && (
                          <Typography variant="caption" color="text.secondary">{value}</Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" display="block">{sub}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Grid container spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  {[
                    ['Loaded Miles', `${load.miles} mi`],
                    ['Deadhead', `${load.deadhead} mi`],
                    ['Dimensions', load.dims],
                  ].map(([k, v]) => (
                    <Grid item xs={4} key={k}>
                      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{v}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Suspense fallback={
                    <Box sx={{ height: 224, bgcolor: 'action.hover', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress size={24} />
                    </Box>
                  }>
                    <RouteMap
                      origin={load.origin}
                      dest={load.dest}
                      miles={load._raw?.miles}
                      pickupLat={load.pickupLat}
                      pickupLng={load.pickupLng}
                      deliveryLat={load.deliveryLat}
                      deliveryLng={load.deliveryLng}
                    />
                  </Suspense>
                </Box>
              </CardContent>
            </Card>

            {/* Profit breakdown */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profit Breakdown</Typography>
                <Stack spacing={0}>
                  {[
                    { label: 'Gross Rate', value: `+$${grossRevenue.toLocaleString()}`, color: 'success.main' },
                    { label: `Fuel (~${load.miles} mi @ $${load.dieselPrice ? load.dieselPrice.toFixed(2) : '—'}/gal)`, value: `-$${fuelCostEst}`, color: 'error.main' },
                    { label: `Deadhead (${load.deadhead} mi)`, value: `-$${deadheadCost}`, color: 'error.main' },
                    { label: 'Misc / tolls', value: '-$120', color: 'error.main' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color }}>{value}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2 }}>
                    <Typography variant="body1" fontWeight={700}>Estimated Net Profit</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: netProfit > 0 ? 'success.main' : 'error.main' }}>
                      {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ mt: 2 }}>
                  <ProfitBadge score={load.profitScore} net={netProfit} ratePerMile={load.ratePerMile} size="lg" />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Broker */}
            {load.broker && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Broker</Typography>
                  <BrokerRating broker={load.broker} />
                </CardContent>
              </Card>
            )}

            {/* Quick stats */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Quick Stats</Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Rate', value: `$${load.rate.toLocaleString()}` },
                    { label: 'Per Mile', value: `$${load.ratePerMile}` },
                    { label: 'Weight', value: load.weight },
                    { label: 'Commodity', value: load.commodity },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* CTAs */}
            <Stack spacing={1.5}>
              {bookingStatus === 'instant_booked' && (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="body2" fontWeight={600}>Booked!</Typography>
                  <Typography variant="caption">This load is now assigned to you.</Typography>
                </Alert>
              )}

              {bookingStatus === 'pending' && (
                <Alert severity="warning" icon={<AccessTimeIcon />}>
                  <Typography variant="body2" fontWeight={600}>Request Sent</Typography>
                  <Typography variant="caption">Awaiting broker approval.</Typography>
                </Alert>
              )}

              {!bookingStatus && (
                <>
                  {load.instantBook && canInstantBook && (
                    <Button
                      onClick={handleInstantBook}
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<BoltIcon />}
                      size="large"
                    >
                      Instant Book
                    </Button>
                  )}

                  {load.instantBook && !canInstantBook && (
                    <Button
                      variant="outlined"
                      disabled
                      fullWidth
                      startIcon={<BoltIcon />}
                    >
                      Instant Book · Not on allowlist
                    </Button>
                  )}

                  {load.bookNow && !load.instantBook && (
                    <Button
                      onClick={handleBookNow}
                      variant="contained"
                      fullWidth
                      startIcon={<EventAvailableIcon />}
                      size="large"
                    >
                      Book Now
                    </Button>
                  )}

                  {myBid ? (
                    <Card variant="outlined" sx={{
                      borderColor:
                        myBid.status === 'accepted' ? 'success.main' :
                        myBid.status === 'countered' ? 'info.main' :
                        myBid.status === 'rejected' ? 'error.main' : 'warning.main'
                    }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Chip
                            label={getBidStatusLabel(myBid.status)}
                            size="small"
                            color={getBidStatusColor(myBid.status)}
                          />
                          <Typography variant="body2" fontWeight={700}>${myBid.amount.toLocaleString()}</Typography>
                        </Box>
                        {myBid.status === 'countered' && myBid.counter_amount && (
                          <Typography variant="caption" color="info.main">
                            Counter offer: <strong>${myBid.counter_amount.toLocaleString()}</strong>
                            {myBid.counter_note && ` — "${myBid.counter_note}"`}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      component={Link}
                      to={`/carrier/loads/${id}/bid`}
                      variant="outlined"
                      fullWidth
                      startIcon={<AttachMoneyIcon />}
                      size="large"
                    >
                      Place Bid / Counter Offer
                    </Button>
                  )}
                </>
              )}

              {/* Message Broker */}
              {!messageOpen ? (
                <Button
                  onClick={() => setMessageOpen(true)}
                  variant="outlined"
                  fullWidth
                  startIcon={<MessageIcon />}
                >
                  Message Broker
                </Button>
              ) : (
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Message {load.broker?.name}
                      </Typography>
                      <IconButton size="small" onClick={() => setMessageOpen(false)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      placeholder="Ask about the load, negotiate rate, etc..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      sx={{ mb: 1.5 }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      variant="contained"
                      fullWidth
                      startIcon={<SendIcon />}
                    >
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Stack>

            {/* Warning if bad broker */}
            {load.broker?.warns > 0 && (
              <Alert severity="error" icon={<WarningAmberIcon />}>
                <Typography variant="body2" fontWeight={600} gutterBottom>Broker Warning</Typography>
                <Typography variant="caption">
                  This broker has {load.broker.warns} active warning flag{load.broker.warns > 1 ? 's' : ''} from other drivers. Proceed with caution.
                </Typography>
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Documents & Load Messages */}
      <Card sx={{ mt: 0 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>Documents & Load Messages</Typography>
          </Box>
          <DocumentPanel loadId={id} />
        </CardContent>
      </Card>
    </Box>
  );
}
