import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Avatar, Button, IconButton, Chip,
  Tabs, Tab, TextField, Grid, CircularProgress, LinearProgress,
  FormControlLabel, Checkbox, Paper,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BoltIcon from '@mui/icons-material/Bolt';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import BlockIcon from '@mui/icons-material/Block';
import GppBadIcon from '@mui/icons-material/GppBad';
import { useAuth } from '../../context/AuthContext';
import { brokersApi, blocksApi, authApi } from '../../services/api';
import { adaptBroker, adaptReview } from '../../services/adapters';

function StarInput({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
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

function SubRating({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 112, flexShrink: 0 }}>{label}</Typography>
      <LinearProgress
        variant="determinate"
        value={(value / 5) * 100}
        sx={{ flex: 1, height: 6, borderRadius: 3 }}
      />
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

function BrokerLogoCircle({ logo, name, size = 64, isOwner = false, onUpload }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 256);
      await onUpload(dataUrl);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      {logo
        ? <Avatar src={logo} alt={name} sx={{ width: size, height: size, border: 2, borderColor: 'divider' }} />
        : <Avatar sx={{ width: size, height: size, bgcolor: 'primary.dark', fontSize: size * 0.28, fontWeight: 900 }}>{initials}</Avatar>
      }
      {isOwner && (
        <>
          <Box
            onClick={() => !uploading && ref.current.click()}
            sx={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploading ? 1 : 0, '&:hover': { opacity: 1 }, cursor: 'pointer', transition: 'opacity 0.2s',
            }}
          >
            {uploading
              ? <CircularProgress size={18} sx={{ color: '#fff' }} />
              : <CameraAltIcon sx={{ color: '#fff', fontSize: 20 }} />
            }
          </Box>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </>
      )}
    </Box>
  );
}

const BADGE_MAP = {
  elite:    { label: 'Elite Partner', color: 'info',    Icon: BoltIcon },
  trusted:  { label: 'Trusted',       color: 'primary', Icon: ShieldIcon },
  verified: { label: 'Verified',      color: 'primary', Icon: ShieldIcon },
  warning:  { label: 'Warning',       color: 'error',   Icon: WarningAmberIcon },
};

export default function BrokerProfile() {
  const { brokerId } = useParams();
  const { user, updateUser } = useAuth();

  const [broker, setBroker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingBroker, setLoadingBroker] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [brokerError, setBrokerError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    brokersApi.get(brokerId)
      .then(data => {
        const adapted = adaptBroker(data);
        setBroker(adapted);
        if (adapted?.user_id && user?.id !== adapted.user_id) {
          blocksApi.check(adapted.user_id)
            .then(d => setIsBlocked(d.is_blocked))
            .catch(() => {});
        }
      })
      .catch(err => setBrokerError(err.message))
      .finally(() => setLoadingBroker(false));

    brokersApi.reviews(brokerId)
      .then(data => setReviews(Array.isArray(data) ? data.map(adaptReview) : []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [brokerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleBlock = async () => {
    setBlockLoading(true);
    try {
      const targetId = broker?.user_id || brokerId;
      if (isBlocked) {
        await blocksApi.unblock(targetId);
        setIsBlocked(false);
      } else {
        await blocksApi.block(targetId);
        setIsBlocked(true);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBlockLoading(false);
    }
  };

  const isOwner = broker ? user?.id === broker.user_id : false;
  const logo = isOwner ? (user?.avatar_url ?? broker?.logo) : broker?.logo;
  const handleLogoUpload = async (dataUrl) => {
    await authApi.update({ avatar_url: dataUrl });
    updateUser({ avatar_url: dataUrl });
  };

  const [tab, setTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    rating: 0, communication: 0, accuracy: 0,
    paymentDays: '', wouldWorkAgain: null, comment: '', isAnonymous: false,
  });

  if (loadingBroker) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (brokerError || !broker) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography color="text.secondary">{brokerError || 'Broker not found.'}</Typography>
      <Button component={Link} to="/carrier/loads" variant="text" sx={{ mt: 1 }}>Back to Load Board</Button>
    </Box>
  );

  const allPaymentDays = reviews.filter(r => r.paymentDays).map(r => r.paymentDays);
  const avgPaymentDays = allPaymentDays.length
    ? Math.round(allPaymentDays.reduce((a, b) => a + b, 0) / allPaymentDays.length)
    : null;
  const paySpeedVerified = allPaymentDays.length >= 3;

  const badge = broker.badge ? BADGE_MAP[broker.badge] : null;

  const handleSubmitReview = () => {
    if (form.rating === 0) return;
    brokersApi.review(brokerId, {
      broker_id: brokerId,
      rating: form.rating,
      communication: form.communication || null,
      accuracy: form.accuracy || null,
      payment_days: form.paymentDays ? parseInt(form.paymentDays) : null,
      would_work_again: form.wouldWorkAgain,
      comment: form.comment || null,
      is_anonymous: form.isAnonymous,
    })
      .then(() => { setSubmitted(true); setShowForm(false); })
      .catch(err => alert(err.message));
  };

  const avgComm = reviews.filter(r => r.communication).length
    ? (reviews.reduce((a, r) => a + (r.communication || 0), 0) / reviews.filter(r => r.communication).length).toFixed(1)
    : null;
  const avgAcc = reviews.filter(r => r.accuracy).length
    ? (reviews.reduce((a, r) => a + (r.accuracy || 0), 0) / reviews.filter(r => r.accuracy).length).toFixed(1)
    : null;
  const wwaCount = reviews.filter(r => r.wouldWorkAgain === true).length;
  const wwaPct = reviews.length ? Math.round(wwaCount / reviews.length * 100) : null;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button component={Link} to={-1} variant="text" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
        Back
      </Button>

      {/* Hero card */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <BrokerLogoCircle logo={logo} name={broker.name} size={64} isOwner={isOwner} onUpload={handleLogoUpload} />
              <Box>
                {isOwner && !logo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <CameraAltIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">Click the circle to upload your company logo</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={700}>{broker.name}</Typography>
                  {badge && (
                    <Chip
                      icon={<badge.Icon sx={{ fontSize: 14 }} />}
                      label={badge.label}
                      size="small"
                      color={badge.color}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  {broker.mc && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalShippingIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{broker.mc}</Typography>
                    </Box>
                  )}
                  {broker.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{broker.phone}</Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    i <= Math.round(broker.rating || 0)
                      ? <StarIcon key={i} sx={{ fontSize: 18, color: '#FFC107' }} />
                      : <StarBorderIcon key={i} sx={{ fontSize: 18, color: 'text.disabled' }} />
                  ))}
                  <Typography variant="body2" fontWeight={700}>{broker.rating || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">({reviews.length} reviews)</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg Rate/Mile</Typography>
                    <Typography variant="body2" fontWeight={700}>${broker.avgRate}/mi</Typography>
                  </Box>
                  {broker.warns > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Warning Flags</Typography>
                      <Typography variant="body2" fontWeight={700} color="error.main">{broker.warns} active</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {!isOwner && (
                <Button
                  variant="outlined"
                  color={isBlocked ? 'error' : 'inherit'}
                  size="small"
                  startIcon={blockLoading ? <CircularProgress size={14} color="inherit" /> : isBlocked ? <GppBadIcon /> : <BlockIcon />}
                  onClick={handleToggleBlock}
                  disabled={blockLoading}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </Button>
              )}
              {user?.role === 'carrier' && !submitted && (
                <Button variant="contained" size="small" startIcon={<StarIcon />} onClick={() => setShowForm(!showForm)}>
                  Write a Review
                </Button>
              )}
              {submitted && (
                <Chip icon={<CheckCircleIcon />} label="Review submitted" color="success" size="small" />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Pay Speed panel */}
      <Card variant="outlined" sx={{ bgcolor: paySpeedVerified ? 'rgba(21,101,192,0.05)' : 'background.paper', borderColor: paySpeedVerified ? 'primary.main' : 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <AccessTimeIcon sx={{ color: paySpeedVerified ? 'primary.main' : 'text.secondary', mt: 0.25 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={700}>Pay Speed</Typography>
                {paySpeedVerified
                  ? <Chip label="✓ Carrier-Verified" size="small" color="primary" variant="outlined" />
                  : <Chip label="Self-Reported" size="small" variant="outlined" />
                }
              </Box>
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
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={avgPaymentDays <= 21 ? 'primary.main' : avgPaymentDays <= 35 ? 'warning.main' : 'error.main'}
                    >
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
        </CardContent>
      </Card>

      {/* Review form */}
      {showForm && (
        <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2.5}>Your Review of {broker.name}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                  <TextField
                    label="Actual payment received in (days)"
                    size="small"
                    fullWidth
                    type="number"
                    inputProps={{ min: 1, max: 180 }}
                    placeholder="e.g. 21"
                    value={form.paymentDays}
                    onChange={e => setForm(f => ({ ...f, paymentDays: e.target.value }))}
                    helperText="Helps verify pay speed for other drivers"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Would you work with them again?</Typography>
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
                </Grid>
              </Grid>
              <TextField
                label="Your experience"
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder="Tell other drivers about your experience with this broker..."
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
                  <Button variant="contained" size="small" onClick={handleSubmitReview} disabled={form.rating === 0}>
                    Submit Review
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label={`Reviews (${reviews.length})`} />
          <Tab label="Rating Breakdown" />
        </Tabs>

        {/* Reviews tab */}
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loadingReviews ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={24} />
              </Box>
            ) : reviews.length === 0 ? (
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">No reviews yet. Be the first to review this broker.</Typography>
                </CardContent>
              </Card>
            ) : reviews.map(review => (
              <Card key={review.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'action.selected', fontSize: 12, fontWeight: 700 }}>
                          {review.isAnonymous ? '?' : review.carrierName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {review.isAnonymous ? 'Anonymous Driver' : review.carrierName}
                        </Typography>
                        {review.wouldWorkAgain === true && (
                          <Chip label="✓ Would work again" size="small" color="success" variant="outlined" />
                        )}
                        {review.wouldWorkAgain === false && (
                          <Chip label="✗ Would not work again" size="small" color="error" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          i <= review.rating
                            ? <StarIcon key={i} sx={{ fontSize: 13, color: '#FFC107' }} />
                            : <StarBorderIcon key={i} sx={{ fontSize: 13, color: 'text.disabled' }} />
                        ))}
                        <Typography variant="caption" fontWeight={700}>{review.rating}.0</Typography>
                        <Typography variant="caption" color="text.secondary">· {new Date(review.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                    {review.paymentDays && (
                      <Paper
                        variant="outlined"
                        sx={{
                          px: 2, py: 1, textAlign: 'center',
                          borderColor: review.paymentDays <= 21 ? 'primary.main' : review.paymentDays <= 35 ? 'warning.main' : 'error.main',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block">Paid in</Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={review.paymentDays <= 21 ? 'primary.main' : review.paymentDays <= 35 ? 'warning.main' : 'error.main'}
                        >
                          {review.paymentDays} days
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                    <SubRating label="Communication" value={review.communication} />
                    <SubRating label="Load Accuracy" value={review.accuracy} />
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{review.comment}</Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Stats tab */}
        {tab === 1 && (
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Overall Rating', value: broker.rating, color: 'primary.main' },
                  { label: 'Communication', value: avgComm, color: 'info.main' },
                  { label: 'Load Accuracy', value: avgAcc, color: 'secondary.main' },
                ].map(({ label, value, color }) => (
                  <Grid item xs={12} sm={4} key={label}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
                      <Typography variant="h4" fontWeight={800} color={value ? color : 'text.disabled'}>{value || '—'}</Typography>
                      {value && <Typography variant="caption" color="text.secondary">out of 5</Typography>}
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1.5}>Star Distribution</Typography>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0;
                  return (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.25, width: 64 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          i <= star
                            ? <StarIcon key={i} sx={{ fontSize: 11, color: '#FFC107' }} />
                            : <StarBorderIcon key={i} sx={{ fontSize: 11, color: 'text.disabled' }} />
                        ))}
                      </Box>
                      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ width: 24, textAlign: 'right' }}>{count}</Typography>
                    </Box>
                  );
                })}
              </Box>

              {wwaPct !== null && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'primary.main', bgcolor: 'rgba(21,101,192,0.04)' }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{wwaPct}% would work again</Typography>
                    <Typography variant="caption" color="text.secondary">Based on {reviews.filter(r => r.wouldWorkAgain !== null).length} responses</Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color={wwaPct >= 80 ? 'primary.main' : wwaPct >= 60 ? 'warning.main' : 'error.main'}
                  >
                    {wwaPct}%
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
