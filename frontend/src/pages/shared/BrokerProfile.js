import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, IconButton, Chip,
  TextField, Grid, CircularProgress, LinearProgress, Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { brokersApi, blocksApi, authApi, networkApi } from '../../services/api';
import { adaptBroker, adaptReview } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

function formatPhone(raw) {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return raw;
}

function StarInput({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
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

function SubRating({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 112, flexShrink: 0 }}>{label}</Typography>
      <LinearProgress variant="determinate" value={(value / 5) * 100} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
      <Typography variant="caption" color="text.secondary">{value}/5</Typography>
    </Box>
  );
}

function resizeToDataUrl(file, size = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });
}

const BADGE_MAP = {
  elite:    { label: 'Elite Partner', color: 'info',    icon: 'flash-outline' },
  trusted:  { label: 'Trusted',       color: 'primary', icon: 'shield-outline' },
  verified: { label: 'Verified',      color: 'primary', icon: 'shield-checkmark-outline' },
  warning:  { label: 'Warning',       color: 'error',   icon: 'warning-outline' },
};

export default function BrokerProfile() {
  const { brokerId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const activeTab = searchParams.get('tab') || 'overview';
  const photoRef = useRef();
  const [photoUploading, setPhotoUploading] = useState(false);

  const [broker, setBroker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingBroker, setLoadingBroker] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [brokerError, setBrokerError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [networkState, setNetworkState] = useState({ status: 'none', entry_id: null, loading: true });
  const [networkConnecting, setNetworkConnecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [canReview, setCanReview] = useState(null);
  const [form, setForm] = useState({
    rating: 0, communication: 0, accuracy: 0,
    paymentDays: '', wouldWorkAgain: null, comment: '',
  });

  useEffect(() => {
    brokersApi.get(brokerId)
      .then(data => {
        const adapted = adaptBroker(data);
        setBroker(adapted);
        if (adapted?.user_id && user?.id !== adapted.user_id) {
          blocksApi.check(adapted.user_id).then(d => setIsBlocked(d.is_blocked)).catch(() => {});
          if (user?.role === 'carrier') {
            networkApi.check(adapted.user_id)
              .then(d => setNetworkState({ status: d.status, entry_id: d.entry_id, loading: false }))
              .catch(() => setNetworkState({ status: 'none', entry_id: null, loading: false }));
          } else {
            setNetworkState(prev => ({ ...prev, loading: false }));
          }
        } else {
          setNetworkState(prev => ({ ...prev, loading: false }));
        }
      })
      .catch(err => setBrokerError(err.message))
      .finally(() => setLoadingBroker(false));

    brokersApi.reviews(brokerId)
      .then(data => setReviews(Array.isArray(data) ? data.map(adaptReview) : []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [brokerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!broker || user?.role !== 'carrier') return;
    brokersApi.canReview(broker.id)
      .then(data => setCanReview(data))
      .catch(() => setCanReview({ can_review: false, reason: null }));
  }, [broker]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    if (!broker?.user_id) return;
    setNetworkConnecting(true);
    networkApi.add(broker.user_id)
      .then(res => setNetworkState({ status: res.status, entry_id: res.id, loading: false }))
      .catch(err => alert(err.message || 'Failed to send connection request'))
      .finally(() => setNetworkConnecting(false));
  };

  const handleToggleBlock = async () => {
    setBlockLoading(true);
    try {
      const targetId = broker?.user_id || brokerId;
      if (isBlocked) { await blocksApi.unblock(targetId); setIsBlocked(false); }
      else           { await blocksApi.block(targetId);   setIsBlocked(true);  }
    } catch (e) { alert(e.message); }
    finally { setBlockLoading(false); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 400);
      await authApi.update({ avatar_url: dataUrl });
      updateUser({ avatar_url: dataUrl });
    } catch { alert('Failed to upload photo.'); }
    finally { setPhotoUploading(false); e.target.value = ''; }
  };

  const handleSubmitReview = () => {
    if (form.rating === 0) return;
    brokersApi.review(broker.id, {
      rating: form.rating,
      communication: form.communication || null,
      accuracy: form.accuracy || null,
      payment_days: form.paymentDays ? parseInt(form.paymentDays) : null,
      would_work_again: form.wouldWorkAgain,
      comment: form.comment || null,
    })
      .then(() => { setSubmitted(true); setShowForm(false); })
      .catch(err => alert(err.message));
  };

  if (loadingBroker) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  );
  if (brokerError || !broker) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary">{brokerError || 'Broker not found.'}</Typography>
      <Button component={Link} to="/carrier/loads" variant="text" sx={{ mt: 1 }}>Back to Load Board</Button>
    </Box>
  );

  const isOwner = user?.id === broker.user_id;
  const photoUrl = isOwner ? (user?.avatar_url ?? broker?.logo) : broker?.logo;
  const badge = broker.badge ? BADGE_MAP[broker.badge] : null;

  const allPaymentDays = reviews.filter(r => r.paymentDays).map(r => r.paymentDays);
  const avgPaymentDays = allPaymentDays.length
    ? Math.round(allPaymentDays.reduce((a, b) => a + b, 0) / allPaymentDays.length) : null;
  const paySpeedVerified = allPaymentDays.length >= 3;

  const avgComm = reviews.filter(r => r.communication).length
    ? (reviews.reduce((a, r) => a + (r.communication || 0), 0) / reviews.filter(r => r.communication).length).toFixed(1) : null;
  const avgAcc = reviews.filter(r => r.accuracy).length
    ? (reviews.reduce((a, r) => a + (r.accuracy || 0), 0) / reviews.filter(r => r.accuracy).length).toFixed(1) : null;
  const wwaCount = reviews.filter(r => r.wouldWorkAgain === true).length;
  const wwaPct = reviews.length ? Math.round(wwaCount / reviews.length * 100) : null;

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

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
      <Box sx={{ py: 2, display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap', mb: 3 }}>

        {/* Left: Photo */}
        <Box sx={{ flexShrink: 0, position: 'relative' }}>
          <Box
            onClick={isOwner ? () => !photoUploading && photoRef.current.click() : undefined}
            sx={{
              width: 400, height: 400,
              borderRadius: '10px', overflow: 'hidden',
              bgcolor: isDark ? '#2a2a2a' : '#e8e8e8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isOwner ? 'pointer' : 'default', position: 'relative',
              ...(isOwner && { '&:hover .cam-overlay': { opacity: 1 } }),
            }}
          >
            {photoUrl
              ? <img src={photoUrl} alt={broker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Typography sx={{ fontSize: '5rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>
                  {broker.name?.charAt(0) || '?'}
                </Typography>
            }
            {isOwner && (
              <Box className="cam-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                {photoUploading ? <CircularProgress size={28} sx={{ color: '#fff' }} /> : <IonIcon name="camera-outline" sx={{ color: '#fff', fontSize: 28 }} />}
              </Box>
            )}
          </Box>
          {isOwner && (
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          )}
        </Box>

        {/* Right: Info cards */}
        <Box sx={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Broker Info */}
          <Box sx={cardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>Broker Info</Typography>
                {badge && (
                  <Chip icon={<IonIcon name={badge.icon} sx={{ fontSize: 14 }} />} label={badge.label}
                    size="small" color={badge.color} variant="outlined" />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <IonIcon name="star" sx={{ color: '#FFC107', fontSize: 15 }} />
                <Typography variant="body2" fontWeight={700}>{broker.rating || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">({reviews.length} reviews)</Typography>
              </Box>
            </Box>
            <Box sx={{ px: 2.5, pb: 1 }}>
              <InfoRow label="Name" value={broker.name} />
              {broker.mc    && <InfoRow label="MC Number"    value={broker.mc} />}
              {broker.phone && <InfoRow label="Phone"        value={formatPhone(broker.phone)} />}
              <InfoRow label="Role" value="Broker" />
              <InfoRow label="Avg Rate/Mile" value={`$${broker.avgRate}/mi`} />
              {broker.paySpeed && <InfoRow label="Pay Speed" value={broker.paySpeed} />}
              {avgPaymentDays && (
                <InfoRow label={`Carrier-Verified Pay Avg (${allPaymentDays.length} reports)`}
                  value={`${avgPaymentDays} days avg`} />
              )}
              {broker.vetting_status && broker.vetting_status !== 'pending' && (
                <InfoRow label="Status"
                  value={broker.vetting_status === 'verified' ? '✓ Verified'
                    : broker.vetting_status === 'flagged' ? '⚠ Flagged' : '⏳ Under Review'}
                />
              )}
              {broker.warns > 0 && <InfoRow label="Warning Flags" value={`${broker.warns} active`} />}
            </Box>
          </Box>

          {/* Actions */}
          {!isOwner && (
            <Box sx={cardSx}>
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>Actions</Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {user?.role === 'carrier' && !networkState.loading && (
                  networkState.status === 'accepted' ? (
                    <Chip icon={<IonIcon name="checkmark-outline" />} label="Connected" size="small" color="primary" variant="outlined" />
                  ) : networkState.status === 'pending' ? (
                    <Chip label="Request Sent" size="small" color="warning" variant="outlined" />
                  ) : (
                    <Button variant="outlined" size="small"
                      startIcon={networkConnecting ? <CircularProgress size={14} color="inherit" /> : <IonIcon name="person-add-outline" />}
                      onClick={handleConnect} disabled={networkConnecting}>
                      Connect
                    </Button>
                  )
                )}
                {user?.role === 'carrier' && !submitted && canReview?.can_review && (
                  <Button variant="contained" size="small" startIcon={<IonIcon name="star" />} onClick={() => setShowForm(s => !s)}>
                    Write a Review
                  </Button>
                )}
                {user?.role === 'carrier' && !submitted && canReview && !canReview.can_review && (
                  <Chip label={canReview.reason || 'Review unavailable'} size="small" variant="outlined" />
                )}
                {submitted && <Chip icon={<IonIcon name="checkmark-circle" />} label="Review submitted" color="success" size="small" />}
                <Button
                  variant="outlined"
                  color={isBlocked ? 'error' : 'inherit'}
                  size="small"
                  startIcon={blockLoading ? <CircularProgress size={14} color="inherit" /> : isBlocked ? <IonIcon name="shield-outline" /> : <IonIcon name="ban-outline" />}
                  onClick={handleToggleBlock} disabled={blockLoading}
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
              <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <SubRating label="Communication"  value={avgComm} />
                <SubRating label="Load Accuracy"  value={avgAcc} />
                {wwaPct !== null && (
                  <Box sx={{ pt: 0.5 }}>
                    <Chip
                      icon={<IonIcon name="thumbs-up-outline" />}
                      label={`${wwaPct}% would work again`}
                      size="small"
                      color={wwaPct >= 80 ? 'success' : wwaPct >= 60 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                )}
                {/* Star distribution */}
                <Box sx={{ pt: 1 }}>
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0;
                    return (
                      <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                        <Box sx={{ display: 'flex', gap: 0.25, width: 60 }}>
                          {[1,2,3,4,5].map(i => (
                            i <= star
                              ? <IonIcon name="star" key={i} sx={{ fontSize: 11, color: '#FFC107' }} />
                              : <IonIcon name="star-outline" key={i} sx={{ fontSize: 11, color: 'text.disabled' }} />
                          ))}
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 7, borderRadius: 4 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ width: 20, textAlign: 'right' }}>{count}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
      <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Write a review action */}
        {!isOwner && user?.role === 'carrier' && !submitted && !showForm && canReview?.can_review && (
          <Button variant="contained" size="small" startIcon={<IonIcon name="star" />} onClick={() => setShowForm(true)} sx={{ alignSelf: 'flex-start' }}>
            Write a Review
          </Button>
        )}
        {submitted && <Chip icon={<IonIcon name="checkmark-circle" />} label="Review submitted" color="success" size="small" sx={{ alignSelf: 'flex-start' }} />}

        {/* Review Form */}
        {showForm && (
          <Box sx={{ ...cardSx, borderColor: 'primary.main' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>Your Review of {broker.name}</Typography>
            </Box>
            <Box sx={{ px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Overall Rating *</Typography>
                <StarInput value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={28} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Communication</Typography>
                  <StarInput value={form.communication} onChange={v => setForm(f => ({ ...f, communication: v }))} size={22} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Load Accuracy</Typography>
                  <StarInput value={form.accuracy} onChange={v => setForm(f => ({ ...f, accuracy: v }))} size={22} />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Actual payment received in (days)" size="small" fullWidth type="number"
                    inputProps={{ min: 1, max: 180 }} placeholder="e.g. 21"
                    value={form.paymentDays} onChange={e => setForm(f => ({ ...f, paymentDays: e.target.value }))}
                    helperText="Helps verify pay speed for other drivers" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Would you work with them again?</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant={form.wouldWorkAgain === true ? 'contained' : 'outlined'} size="small"
                      startIcon={<IonIcon name="thumbs-up-outline" />}
                      onClick={() => setForm(f => ({ ...f, wouldWorkAgain: true }))}>Yes</Button>
                    <Button variant={form.wouldWorkAgain === false ? 'contained' : 'outlined'}
                      color={form.wouldWorkAgain === false ? 'error' : 'inherit'} size="small"
                      startIcon={<IonIcon name="thumbs-down-outline" />}
                      onClick={() => setForm(f => ({ ...f, wouldWorkAgain: false }))}>No</Button>
                  </Box>
                </Grid>
              </Grid>
              <TextField label="Your experience" size="small" fullWidth multiline rows={3}
                placeholder="Tell other drivers about your experience with this broker..."
                value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button variant="text" size="small" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button variant="contained" size="small" onClick={handleSubmitReview} disabled={form.rating === 0}>Submit Review</Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Reviews list */}
        <Box sx={cardSx}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Carrier Reviews</Typography>
            <Typography variant="caption" color="text.disabled">{reviews.length}</Typography>
          </Box>
          {loadingReviews ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={24} /></Box>
          ) : reviews.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <IonIcon name="chatbubble-outline" sx={{ fontSize: 36, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No reviews yet. Be the first to review this broker.</Typography>
            </Box>
          ) : (
            <Box>
              {reviews.map((review, idx) => (
                <Box key={review.id} sx={{ px: 2.5, py: 2, borderBottom: idx < reviews.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.selected', fontSize: 12, fontWeight: 700 }}>
                          {review.isAnonymous ? '?' : review.carrierName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {review.isAnonymous ? 'Anonymous Driver' : review.carrierName}
                        </Typography>
                        {review.wouldWorkAgain === true  && <Chip label="✓ Would work again"    size="small" color="success" variant="outlined" />}
                        {review.wouldWorkAgain === false && <Chip label="✗ Would not work again" size="small" color="error"   variant="outlined" />}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {[1,2,3,4,5].map(n => (
                          n <= review.rating
                            ? <IonIcon name="star" key={n} sx={{ fontSize: 13, color: '#FFC107' }} />
                            : <IonIcon name="star-outline" key={n} sx={{ fontSize: 13, color: 'text.disabled' }} />
                        ))}
                        <Typography variant="caption" fontWeight={700}>{review.rating}.0</Typography>
                        <Typography variant="caption" color="text.secondary">· {new Date(review.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                    {review.paymentDays && (
                      <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center',
                        borderColor: review.paymentDays <= 21 ? 'primary.main' : review.paymentDays <= 35 ? 'warning.main' : 'error.main' }}>
                        <Typography variant="caption" color="text.secondary" display="block">Paid in</Typography>
                        <Typography variant="body2" fontWeight={700}
                          color={review.paymentDays <= 21 ? 'primary.main' : review.paymentDays <= 35 ? 'warning.main' : 'error.main'}>
                          {review.paymentDays} days
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: review.comment ? 1.5 : 0 }}>
                    <SubRating label="Communication" value={review.communication} />
                    <SubRating label="Load Accuracy" value={review.accuracy} />
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{review.comment}</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

      </Box>
      )}

      {/* ── Pay Speed Tab ── */}
      {activeTab === 'pay_speed' && (
      <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ ...cardSx, borderColor: paySpeedVerified ? 'primary.main' : 'divider', bgcolor: paySpeedVerified ? (isDark ? 'rgba(21,101,192,0.08)' : 'rgba(21,101,192,0.04)') : (isDark ? 'rgba(255,255,255,0.03)' : 'background.paper') }}>
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IonIcon name="time-outline" sx={{ color: paySpeedVerified ? 'primary.main' : 'text.secondary' }} />
            <Typography variant="subtitle1" fontWeight={700}>Pay Speed</Typography>
            {paySpeedVerified
              ? <Chip label="✓ Carrier-Verified" size="small" color="primary" variant="outlined" />
              : <Chip label="Self-Reported" size="small" variant="outlined" />
            }
          </Box>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Broker self-reported</Typography>
                <Typography variant="body2" fontWeight={700} color={broker.paySpeed === 'Quick-Pay' ? 'primary.main' : 'text.primary'}>
                  {broker.paySpeed}
                </Typography>
              </Grid>
              {avgPaymentDays && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Carrier-reported avg ({allPaymentDays.length} reports)</Typography>
                  <Typography variant="body2" fontWeight={700}
                    color={avgPaymentDays <= 21 ? 'primary.main' : avgPaymentDays <= 35 ? 'warning.main' : 'error.main'}>
                    {avgPaymentDays} days avg
                  </Typography>
                </Grid>
              )}
            </Grid>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, lineHeight: 1.6 }}>
              {paySpeedVerified
                ? `Pay speed is calculated from ${allPaymentDays.length} carriers who reported their actual payment time.`
                : 'Pay speed is self-declared by the broker. It will be verified once 3+ carriers report in reviews.'
              }
            </Typography>
          </Box>
        </Box>
      </Box>
      )}

    </Box>
  );
}
