import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadsApi, bidsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, CircularProgress,
  Paper, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceIcon from '@mui/icons-material/Place';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InventoryIcon from '@mui/icons-material/Inventory';
import ScaleIcon from '@mui/icons-material/Scale';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const RouteMap = lazy(() => import('../../components/shared/RouteMap'));

function loadStatusChip(status) {
  if (status === 'active') return <Chip label="Active" color="success" size="small" />;
  if (status === 'filled') return <Chip label="Filled" color="info" size="small" />;
  return <Chip label="Expired" color="error" size="small" />;
}

function bidStatusChip(status) {
  const map = {
    pending:   { label: 'Pending',   color: 'warning' },
    accepted:  { label: 'Accepted',  color: 'success' },
    rejected:  { label: 'Rejected',  color: 'error' },
    countered: { label: 'Countered', color: 'info' },
    withdrawn: { label: 'Withdrawn', color: 'default' },
  };
  const cfg = map[status] || map.pending;
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

export default function BrokerLoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      loadsApi.get(id).then(adaptLoad),
      bidsApi.forLoad(id).catch(() => []),
    ])
      .then(([l, b]) => { setLoad(l); setBids(Array.isArray(b) ? b : []); })
      .catch(() => setError('Load not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcceptBid = (bidId) => {
    setActionLoading(bidId);
    bidsApi.accept(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  const handleRejectBid = (bidId) => {
    setActionLoading(bidId + '_reject');
    bidsApi.reject(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (error || !load) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>{error || 'Load not found'}</Alert>
      <Button variant="outlined" onClick={() => navigate(-1)}>Go back</Button>
    </Box>
  );

  const pendingBids = bids.filter(b => b.status === 'pending');

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start' }}>
        Back to Manage Loads
      </Button>

      {/* Load Header */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Load #{load.id.slice(0, 8)}</Typography>
              <Typography variant="h6" fontWeight={700}>{load.origin} → {load.dest}</Typography>
              <Typography variant="body2" color="text.secondary">{load.type} · {load.miles} miles</Typography>
            </Box>
            {loadStatusChip(load.status)}
          </Box>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Rate', value: `$${(load.rate || 0).toLocaleString()}`, icon: <AttachMoneyIcon sx={{ fontSize: 14 }} /> },
              { label: 'Per Mile', value: `$${(load.ratePerMile || 0).toFixed(2)}` },
              { label: 'Views', value: load.viewCount || 0, icon: <VisibilityIcon sx={{ fontSize: 14 }} /> },
              { label: 'Bids', value: bids.length, icon: <GroupIcon sx={{ fontSize: 14 }} /> },
            ].map(({ label, value, icon }) => (
              <Grid item xs={6} sm={3} key={label}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    {icon}{label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Details */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { icon: <PlaceIcon sx={{ fontSize: 14, color: 'primary.main' }} />, text: `Origin: ${load.origin}` },
                  { icon: <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />, text: `Dest: ${load.dest}` },
                  { icon: <CalendarTodayIcon sx={{ fontSize: 14 }} />, text: `Pickup: ${load.pickup}` },
                  { icon: <CalendarTodayIcon sx={{ fontSize: 14 }} />, text: `Delivery: ${load.delivery}` },
                ].map(({ icon, text }) => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon}
                    <Typography variant="body2" color="text.secondary">{text}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {load.commodity && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon sx={{ fontSize: 14 }} />
                    <Typography variant="body2" color="text.secondary">Commodity: {load.commodity}</Typography>
                  </Box>
                )}
                {load.weight && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScaleIcon sx={{ fontSize: 14 }} />
                    <Typography variant="body2" color="text.secondary">Weight: {load.weight}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingIcon sx={{ fontSize: 14 }} />
                  <Typography variant="body2" color="text.secondary">Type: {load.type}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {load.notes && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Notes</Typography>
              <Typography variant="body2">{load.notes}</Typography>
            </Paper>
          )}

          <Suspense fallback={
            <Box sx={{ height: 224, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          }>
            <RouteMap origin={load.origin} dest={load.dest} miles={load._raw?.miles} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Bids */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <GroupIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>Bids</Typography>
            {pendingBids.length > 0 && (
              <Chip label={`${pendingBids.length} pending`} size="small" color="warning" />
            )}
          </Box>

          {bids.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No bids yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bids.map(bid => (
                <Paper key={bid.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography
                          component={Link}
                          to={`/carrier-profile/${bid.carrier_id}`}
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {bid.carrier_name || 'Carrier'}
                        </Typography>
                        {bid.carrier_mc && (
                          <Typography variant="caption" color="text.secondary">MC-{bid.carrier_mc}</Typography>
                        )}
                        {bidStatusChip(bid.status)}
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ${(bid.amount || 0).toLocaleString()}
                      </Typography>
                      {bid.note && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                          "{bid.note}"
                        </Typography>
                      )}
                      {bid.counter_amount && (
                        <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                          Counter offer: ${bid.counter_amount.toLocaleString()}
                          {bid.counter_note && ` — ${bid.counter_note}`}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Button
                        component={Link}
                        to="/broker/messages"
                        variant="text"
                        size="small"
                        title="Message carrier"
                        sx={{ minWidth: 0, px: 1 }}
                      >
                        <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                      </Button>
                      {bid.status === 'pending' && load.status === 'active' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={actionLoading === bid.id ? <CircularProgress size={12} color="inherit" /> : <CheckCircleIcon />}
                            onClick={() => handleAcceptBid(bid.id)}
                            disabled={actionLoading === bid.id}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={actionLoading === bid.id + '_reject' ? <CircularProgress size={12} color="inherit" /> : <CancelIcon />}
                            onClick={() => handleRejectBid(bid.id)}
                            disabled={actionLoading === bid.id + '_reject'}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
