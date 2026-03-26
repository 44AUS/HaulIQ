import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Avatar, Button, IconButton, Chip,
  TextField, Grid, CircularProgress, LinearProgress,
  FormControlLabel, Checkbox,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import CheckIcon from '@mui/icons-material/Check';
import PhoneIcon from '@mui/icons-material/Phone';
import BlockIcon from '@mui/icons-material/Block';
import GppBadIcon from '@mui/icons-material/GppBad';
import { useAuth } from '../../context/AuthContext';
import { carrierReviewsApi, networkApi, blocksApi } from '../../services/api';
import { adaptReview } from '../../services/adapters';

function StarInput({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconButton
          key={i}
          size="small"
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          sx={{ p: 0.25 }}
        >
          {(hover || value) >= i
            ? <StarIcon sx={{ fontSize: size, color: '#FFC107' }} />
            : <StarBorderIcon sx={{ fontSize: size, color: 'text.disabled' }} />
          }
        </IconButton>
      ))}
    </Box>
  );
}

function MiniBar({ value, max = 5 }) {
  if (!value) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        sx={{ width: 80, height: 6, borderRadius: 3 }}
      />
      <Typography variant="caption" fontWeight={600}>{value}</Typography>
    </Box>
  );
}

export default function CarrierProfile() {
  const { carrierId } = useParams();
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [networkState, setNetworkState] = useState({ status: 'none', entry_id: null, loading: true });
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [form, setForm] = useState({
    rating: 0, communication: 0, onTimePickup: 0, onTimeDelivery: 0, loadCare: 0,
    wouldWorkAgain: null, comment: '', isAnonymous: false,
  });

  useEffect(() => {
    carrierReviewsApi.get(carrierId)
      .then(data => setReviews(Array.isArray(data) ? data.map(adaptReview) : []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));

    carrierReviewsApi.stats(carrierId)
      .then(data => setStats(data))
      .catch(() => setStats(null));

    if (user?.role === 'broker') {
      networkApi.check(carrierId)
        .then(data => setNetworkState({ status: data.status, entry_id: data.entry_id, loading: false }))
        .catch(() => setNetworkState({ status: 'none', entry_id: null, loading: false }));
      blocksApi.check(carrierId)
        .then(data => setIsBlocked(data.is_blocked))
        .catch(() => {});
    } else {
      setNetworkState(prev => ({ ...prev, loading: false }));
    }
  }, [carrierId, user?.role]);

  const handleToggleBlock = async () => {
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await blocksApi.unblock(carrierId);
        setIsBlocked(false);
      } else {
        await blocksApi.block(carrierId);
        setIsBlocked(true);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleAddToNetwork = () => {
    setNetworkState(prev => ({ ...prev, loading: true }));
    networkApi.add(carrierId)
      .then(res => setNetworkState({ status: res.status, entry_id: res.id, loading: false }))
      .catch(() => setNetworkState(prev => ({ ...prev, loading: false })));
  };

  const avgOverall = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : (stats?.avg_rating ?? '—');

  const _avg = (key) => {
    const vals = reviews.filter(r => r[key]).map(r => r[key]);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  const wwaCount = reviews.filter(r => r.wouldWorkAgain === true).length;
  const wwaPct = reviews.filter(r => r.wouldWorkAgain !== null).length
    ? Math.round(wwaCount / reviews.filter(r => r.wouldWorkAgain !== null).length * 100)
    : null;

  const handleSubmit = () => {
    if (form.rating === 0) return;
    carrierReviewsApi.post({
      carrier_id: carrierId,
      rating: form.rating,
      communication: form.communication || null,
      on_time_pickup: form.onTimePickup || null,
      on_time_delivery: form.onTimeDelivery || null,
      load_care: form.loadCare || null,
      would_work_again: form.wouldWorkAgain,
      comment: form.comment || null,
      is_anonymous: form.isAnonymous,
    })
      .then(() => { setSubmitted(true); setShowForm(false); })
      .catch(err => alert(err.message));
  };

  const displayName = stats?.company || stats?.name || `Carrier ${carrierId.slice(0, 8)}`;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button component={Link} to={-1} variant="text" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
        Back
      </Button>

      {/* Hero card */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.dark', fontSize: 22, fontWeight: 900, flexShrink: 0 }}>
                {displayName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700} mb={0.25}>{displayName}</Typography>
                {stats?.company && stats?.name && stats.company !== stats.name && (
                  <Typography variant="body2" color="text.secondary">{stats.name}</Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                  {stats?.mc_number && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalShippingIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{stats.mc_number}</Typography>
                    </Box>
                  )}
                  {stats?.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{stats.phone}</Typography>
                    </Box>
                  )}
                  {stats?.total_reviews != null && (
                    <Typography variant="caption" color="text.secondary">{stats.total_reviews} reviews</Typography>
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'flex-end', mb: 0.5 }}>
                <StarIcon sx={{ color: '#FFC107', fontSize: 20 }} />
                <Typography variant="h5" fontWeight={700}>{avgOverall}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">{reviews.length} broker reviews</Typography>
              {user?.role === 'broker' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', mt: 1.5, flexWrap: 'wrap' }}>
                  {!networkState.loading && (
                    networkState.status === 'accepted' ? (
                      <Chip icon={<CheckIcon />} label="In Network" size="small" color="primary" variant="outlined" />
                    ) : networkState.status === 'pending' ? (
                      <Chip label="Request Sent" size="small" color="warning" variant="outlined" />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<NetworkCheckIcon />}
                        onClick={handleAddToNetwork}
                      >
                        Add to Network
                      </Button>
                    )
                  )}
                  {!submitted && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<StarIcon />}
                      onClick={() => setShowForm(!showForm)}
                    >
                      Review
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color={isBlocked ? 'error' : 'inherit'}
                    size="small"
                    startIcon={blockLoading ? <CircularProgress size={12} color="inherit" /> : isBlocked ? <GppBadIcon /> : <BlockIcon />}
                    onClick={handleToggleBlock}
                    disabled={blockLoading}
                    title={isBlocked ? 'Unblock user' : 'Block user'}
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </Button>
                </Box>
              )}
              {submitted && <Chip icon={<CheckCircleIcon />} label="Submitted" color="success" size="small" sx={{ mt: 1 }} />}
            </Box>
          </Box>

          {/* Sub-rating bars */}
          <Box sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              {[
                { label: 'Communication',    value: _avg('communication') },
                { label: 'On-Time Pickup',   value: _avg('onTimePickup') },
                { label: 'On-Time Delivery', value: _avg('onTimeDelivery') },
                { label: 'Load Care',        value: _avg('loadCare') },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={3} key={label}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{label}</Typography>
                  <MiniBar value={value} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {wwaPct !== null && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<ThumbUpIcon />}
                label={`${wwaPct}% of brokers would book again`}
                size="small"
                color={wwaPct >= 80 ? 'success' : wwaPct >= 60 ? 'warning' : 'error'}
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Review form */}
      {showForm && (
        <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2.5}>Review {displayName}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Overall Rating *</Typography>
                <StarInput value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={28} />
              </Box>
              <Grid container spacing={2}>
                {[
                  { key: 'communication',  label: 'Communication' },
                  { key: 'onTimePickup',   label: 'On-Time Pickup' },
                  { key: 'onTimeDelivery', label: 'On-Time Delivery' },
                  { key: 'loadCare',       label: 'Load Care / No Damage' },
                ].map(({ key, label }) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="body2" fontWeight={600} mb={1}>{label}</Typography>
                    <StarInput value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} size={20} />
                  </Grid>
                ))}
              </Grid>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Would you book this carrier again?</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={form.wouldWorkAgain === true ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => setForm(f => ({ ...f, wouldWorkAgain: true }))}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={form.wouldWorkAgain === false ? 'contained' : 'outlined'}
                    color={form.wouldWorkAgain === false ? 'error' : 'inherit'}
                    size="small"
                    startIcon={<ThumbDownIcon />}
                    onClick={() => setForm(f => ({ ...f, wouldWorkAgain: false }))}
                  >
                    No
                  </Button>
                </Box>
              </Box>
              <TextField
                label="Your experience"
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder="Describe reliability, professionalism, any issues..."
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} />}
                  label={<Typography variant="body2">Submit anonymously</Typography>}
                />
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="text" size="small" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button variant="contained" size="small" onClick={handleSubmit} disabled={form.rating === 0}>
                    Submit Review
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Reviews list */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Broker Reviews ({reviews.length})</Typography>
        {loadingReviews ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : reviews.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <PeopleIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No reviews yet for this carrier.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map(review => (
              <Card key={review.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.selected', fontSize: 12, fontWeight: 700 }}>
                          {review.isAnonymous ? '?' : review.brokerName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {review.isAnonymous ? 'Anonymous Broker' : review.brokerName}
                        </Typography>
                        {review.wouldWorkAgain === true && (
                          <Chip label="✓ Would book again" size="small" color="success" variant="outlined" />
                        )}
                        {review.wouldWorkAgain === false && (
                          <Chip label="✗ Would not book again" size="small" color="error" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          i <= review.rating
                            ? <StarIcon key={i} sx={{ fontSize: 13, color: '#FFC107' }} />
                            : <StarBorderIcon key={i} sx={{ fontSize: 13, color: 'text.disabled' }} />
                        ))}
                        <Typography variant="caption" fontWeight={700}>{review.rating}.0</Typography>
                        <Typography variant="caption" color="text.secondary">· {new Date(review.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                    {[
                      { label: 'Communication',    value: review.communication },
                      { label: 'On-Time Pickup',   value: review.onTimePickup },
                      { label: 'On-Time Delivery', value: review.onTimeDelivery },
                      { label: 'Load Care',        value: review.loadCare },
                    ].filter(x => x.value).map(({ label, value }) => (
                      <Grid item xs={6} sm={3} key={label}>
                        <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>{label}</Typography>
                        <MiniBar value={value} />
                      </Grid>
                    ))}
                  </Grid>
                  {review.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{review.comment}</Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
