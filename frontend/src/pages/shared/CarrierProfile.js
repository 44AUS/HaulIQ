import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, IconButton, Chip,
  TextField, Grid, CircularProgress, LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { carrierReviewsApi, networkApi, blocksApi } from '../../services/api';
import { adaptReview } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

function formatPhone(raw) {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return raw;
}

function StarInput({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconButton key={i} size="small" type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)} sx={{ p: 0.25 }}>
          {(hover || value) >= i
            ? <IonIcon name="star" sx={{ fontSize: size, color: '#FFC107' }} />
            : <IonIcon name="star-outline" sx={{ fontSize: size, color: 'text.disabled' }} />}
        </IconButton>
      ))}
    </Box>
  );
}

function MiniBar({ value, max = 5 }) {
  if (!value) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress variant="determinate" value={(value / max) * 100} sx={{ width: 80, height: 6, borderRadius: 3 }} />
      <Typography variant="caption" fontWeight={600}>{value}</Typography>
    </Box>
  );
}

export default function CarrierProfile() {
  const { carrierId: carrierIdParam } = useParams();
  const { state } = useLocation();
  const carrierId = state?.carrierId || carrierIdParam;
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [networkState, setNetworkState] = useState({ status: 'none', entry_id: null, loading: true });
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState(null);
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
      carrierReviewsApi.canReview(carrierId)
        .then(data => { setCanReview(data.can_review); setCanReviewReason(data.reason); })
        .catch(() => { setCanReview(false); setCanReviewReason(null); });
    } else {
      setNetworkState(prev => ({ ...prev, loading: false }));
    }
  }, [carrierId, user?.role]);

  const handleToggleBlock = async () => {
    setBlockLoading(true);
    try {
      if (isBlocked) { await blocksApi.unblock(carrierId); setIsBlocked(false); }
      else           { await blocksApi.block(carrierId);   setIsBlocked(true);  }
    } catch (e) { alert(e.message); }
    finally { setBlockLoading(false); }
  };

  const handleAddToNetwork = () => {
    const targetId = stats?.carrier_id || carrierId;
    setNetworkState(prev => ({ ...prev, loading: true }));
    networkApi.add(targetId)
      .then(res => setNetworkState({ status: res.status, entry_id: res.id, loading: false }))
      .catch(err => {
        alert(err.message || 'Failed to send connection request');
        setNetworkState(prev => ({ ...prev, loading: false }));
      });
  };

  const handleSubmit = () => {
    if (form.rating === 0) return;
    carrierReviewsApi.post({
      carrier_id: stats?.carrier_id || carrierId,
      rating: form.rating,
      communication: form.communication || null,
      on_time_pickup: form.onTimePickup || null,
      on_time_delivery: form.onTimeDelivery || null,
      load_care: form.loadCare || null,
      would_work_again: form.wouldWorkAgain,
      comment: form.comment || null,
      is_anonymous: false,
    })
      .then(() => {
        setSubmitted(true); setShowForm(false); setCanReview(false);
        setCanReviewReason('already_reviewed');
        carrierReviewsApi.get(carrierId)
          .then(data => setReviews(Array.isArray(data) ? data.map(adaptReview) : []))
          .catch(() => {});
      })
      .catch(err => alert(err.message));
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
    ? Math.round(wwaCount / reviews.filter(r => r.wouldWorkAgain !== null).length * 100) : null;

  const displayName = stats?.company || stats?.name || `Carrier ${carrierId.slice(0, 8)}`;

  const cardSx = {
    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'background.paper',
    border: '1px solid', borderColor: 'divider', borderRadius: '10px', overflow: 'hidden',
  };

  const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1.3 }}>{label}</Typography>
        {value && <Typography variant="body2" fontWeight={600} noWrap>{value}</Typography>}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 2 }}>

      {/* ── Photo + Info ── */}
      <Box sx={{ py: 2, display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap', mb: 3 }}>

        {/* Left: Photo */}
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{
            width: { xs: 160, sm: 260, md: 300 }, height: { xs: 160, sm: 260, md: 300 },
            borderRadius: '10px', overflow: 'hidden',
            bgcolor: isDark ? '#2a2a2a' : '#e8e8e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {stats?.avatar_url
              ? <img src={stats.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Typography sx={{ fontSize: '5rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>
                  {displayName.charAt(0)}
                </Typography>
            }
          </Box>
        </Box>

        {/* Right: Info cards */}
        <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Carrier Info */}
          <Box sx={cardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>Carrier Info</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <IonIcon name="star" sx={{ color: '#FFC107', fontSize: 15 }} />
                <Typography variant="body2" fontWeight={700}>{avgOverall}</Typography>
                <Typography variant="caption" color="text.secondary">({reviews.length} reviews)</Typography>
              </Box>
            </Box>
            <Box sx={{ px: 2.5, pb: 1 }}>
              <InfoRow label="Name" value={displayName} />
              {stats?.company && stats?.name && stats.company !== stats.name && (
                <InfoRow label="Company" value={stats.company} />
              )}
              {stats?.phone     && <InfoRow label="Phone"      value={formatPhone(stats.phone)} />}
              {stats?.mc_number && <InfoRow label="MC Number"  value={`MC-${stats.mc_number}`} />}
              <InfoRow label="Role" value="Carrier" />
              {stats?.vetting_status && stats.vetting_status !== 'pending' && (
                <InfoRow label="Status"
                  value={stats.vetting_status === 'verified' ? '✓ Verified'
                    : stats.vetting_status === 'flagged' ? '⚠ Flagged' : '⏳ Under Review'}
                />
              )}
            </Box>
          </Box>

          {/* Actions (broker only) */}
          {user?.role === 'broker' && (
            <Box sx={cardSx}>
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>Actions</Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {!networkState.loading && (
                  networkState.status === 'accepted' ? (
                    <Chip icon={<IonIcon name="checkmark-outline" />} label="In Network" size="small" color="primary" variant="outlined" />
                  ) : networkState.status === 'pending' ? (
                    <Chip label="Request Sent" size="small" color="warning" variant="outlined" />
                  ) : (
                    <Button variant="outlined" size="small" startIcon={<IonIcon name="wifi-outline" />} onClick={handleAddToNetwork}>
                      Add to Network
                    </Button>
                  )
                )}
                {(submitted || canReviewReason === 'already_reviewed') ? (
                  <Chip icon={<IonIcon name="checkmark-circle" />} label="Reviewed" color="success" size="small" />
                ) : canReview ? (
                  <Button variant="contained" size="small" startIcon={<IonIcon name="star" />} onClick={() => setShowForm(s => !s)}>
                    Review
                  </Button>
                ) : canReviewReason === 'no_completed_load' ? (
                  <Chip label="Complete a load to review" size="small" variant="outlined" sx={{ color: 'text.disabled', fontSize: '0.7rem' }} />
                ) : null}
                <Button
                  variant="outlined"
                  color={isBlocked ? 'error' : 'inherit'}
                  size="small"
                  startIcon={blockLoading ? <CircularProgress size={12} color="inherit" /> : isBlocked ? <IonIcon name="shield-outline" /> : <IonIcon name="ban-outline" />}
                  onClick={handleToggleBlock}
                  disabled={blockLoading}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Rating Breakdown */}
          {reviews.length > 0 && (
            <Box sx={cardSx}>
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>Rating Breakdown</Typography>
              </Box>
              <Box sx={{ px: 2.5, pb: 1 }}>
                {[
                  { label: 'Communication',    value: _avg('communication') },
                  { label: 'On-Time Pickup',   value: _avg('onTimePickup') },
                  { label: 'On-Time Delivery', value: _avg('onTimeDelivery') },
                  { label: 'Load Care',        value: _avg('loadCare') },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.disabled">{label}</Typography>
                    <MiniBar value={value} />
                  </Box>
                ))}
                {wwaPct !== null && (
                  <Box sx={{ pt: 1.5, pb: 0.5 }}>
                    <Chip
                      icon={<IonIcon name="thumbs-up-outline" />}
                      label={`${wwaPct}% of brokers would book again`}
                      size="small"
                      color={wwaPct >= 80 ? 'success' : wwaPct >= 60 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Review Form ── */}
      {showForm && (
        <Box sx={{ ...cardSx, borderColor: 'primary.main', mb: 3 }}>
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Review {displayName}</Typography>
          </Box>
          <Box sx={{ px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                <Button variant={form.wouldWorkAgain === true ? 'contained' : 'outlined'} size="small"
                  startIcon={<IonIcon name="thumbs-up-outline" />}
                  onClick={() => setForm(f => ({ ...f, wouldWorkAgain: true }))}>Yes</Button>
                <Button variant={form.wouldWorkAgain === false ? 'contained' : 'outlined'}
                  color={form.wouldWorkAgain === false ? 'error' : 'inherit'} size="small"
                  startIcon={<IonIcon name="thumbs-down-outline" />}
                  onClick={() => setForm(f => ({ ...f, wouldWorkAgain: false }))}>No</Button>
              </Box>
            </Box>
            <TextField label="Your experience" size="small" fullWidth multiline rows={3}
              placeholder="Describe reliability, professionalism, any issues..."
              value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button variant="text" size="small" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="contained" size="small" onClick={handleSubmit} disabled={form.rating === 0}>Submit Review</Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Reviews ── */}
      <Box sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Broker Reviews</Typography>
          <Typography variant="caption" color="text.disabled">{reviews.length}</Typography>
        </Box>
        {loadingReviews ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <IonIcon name="people-outline" sx={{ fontSize: 36, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">No reviews yet for this carrier.</Typography>
          </Box>
        ) : (
          <Box>
            {reviews.map((review, idx) => (
              <Box key={review.id} sx={{ px: 2.5, py: 2, borderBottom: idx < reviews.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Avatar
                    component={review.brokerId ? Link : 'div'}
                    to={review.brokerId ? `/b/${review.brokerId.slice(0, 8)}` : undefined}
                    state={review.brokerId ? { brokerId: review.brokerId } : undefined}
                    src={review.brokerAvatarUrl || undefined}
                    sx={{ width: 28, height: 28, bgcolor: 'primary.dark', fontSize: 12, fontWeight: 700, textDecoration: 'none', cursor: review.brokerId ? 'pointer' : 'default' }}
                  >
                    {review.brokerName.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}
                    component={review.brokerId ? Link : 'span'}
                    to={review.brokerId ? `/b/${review.brokerId.slice(0, 8)}` : undefined}
                    state={review.brokerId ? { brokerId: review.brokerId } : undefined}
                    sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': review.brokerId ? { textDecoration: 'underline' } : {} }}
                  >
                    {review.brokerName}
                  </Typography>
                  {review.wouldWorkAgain === true  && <Chip label="✓ Would book again"    size="small" color="success" variant="outlined" />}
                  {review.wouldWorkAgain === false && <Chip label="✗ Would not book again" size="small" color="error"   variant="outlined" />}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                  {[1,2,3,4,5].map(n => (
                    n <= review.rating
                      ? <IonIcon name="star" key={n} sx={{ fontSize: 13, color: '#FFC107' }} />
                      : <IonIcon name="star-outline" key={n} sx={{ fontSize: 13, color: 'text.disabled' }} />
                  ))}
                  <Typography variant="caption" fontWeight={700}>{review.rating}.0</Typography>
                  <Typography variant="caption" color="text.secondary">· {new Date(review.createdAt).toLocaleDateString()}</Typography>
                </Box>
                {[
                  { label: 'Communication',    value: review.communication },
                  { label: 'On-Time Pickup',   value: review.onTimePickup },
                  { label: 'On-Time Delivery', value: review.onTimeDelivery },
                  { label: 'Load Care',        value: review.loadCare },
                ].filter(x => x.value).length > 0 && (
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
                )}
                {review.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{review.comment}</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
