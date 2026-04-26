import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
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
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
          <IonIcon name={(hover || value) >= i ? 'star' : 'star-outline'} style={{ fontSize: size, color: (hover || value) >= i ? '#FFC107' : 'var(--ion-color-medium)' }} />
        </button>
      ))}
    </div>
  );
}

function MiniBar({ value, max = 5 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--ion-color-primary)', borderRadius: 3 }} />
    </div>
  );
}

function SubRating({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', width: 112, flexShrink: 0 }}>{label}</span>
      <MiniBar value={parseFloat(value)} />
      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{value}/5</span>
    </div>
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
  elite:    { label: 'Elite Partner', color: '#53b1fd',  icon: 'flash-outline' },
  trusted:  { label: 'Trusted',       color: 'var(--ion-color-primary)', icon: 'shield-outline' },
  verified: { label: 'Verified',      color: 'var(--ion-color-primary)', icon: 'shield-checkmark-outline' },
  warning:  { label: 'Warning',       color: 'var(--ion-color-danger)', icon: 'warning-outline' },
};

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))',
  border: '1px solid var(--ion-border-color)', borderRadius: 6,
  color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px',
  outline: 'none', fontFamily: 'inherit',
};

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', lineHeight: 1.3 }}>{label}</div>
        {value && <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{value}</div>}
      </div>
    </div>
  );
}

export default function BrokerProfile() {
  const { brokerId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const { isDark } = useThemeMode();
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );
  if (brokerError || !broker) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <p style={{ color: 'var(--ion-color-medium)' }}>{brokerError || 'Broker not found.'}</p>
      <Link to="/carrier/loads" style={{ color: 'var(--ion-color-primary)', fontSize: '0.875rem' }}>Back to Load Board</Link>
    </div>
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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 24px 16px' }}>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ paddingTop: 16, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>

          {/* Left: Photo */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <div
              onClick={isOwner ? () => !photoUploading && photoRef.current.click() : undefined}
              style={{ width: 400, height: 400, borderRadius: 10, overflow: 'hidden', backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isOwner ? 'pointer' : 'default', position: 'relative' }}
            >
              {photoUrl
                ? <img src={photoUrl} alt={broker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '5rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>{broker.name?.charAt(0) || '?'}</span>
              }
              {isOwner && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  {photoUploading ? <IonSpinner name="crescent" style={{ color: '#fff' }} /> : <IonIcon name="camera-outline" style={{ color: '#fff', fontSize: 28 }} />}
                </div>
              )}
            </div>
            {isOwner && <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />}
          </div>

          {/* Right: Info cards */}
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Broker Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>Broker Info</span>
                  {badge && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: badge.color, border: `1px solid ${badge.color}`, borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                      <IonIcon name={badge.icon} style={{ fontSize: 12 }} /> {badge.label}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IonIcon name="star" style={{ color: '#FFC107', fontSize: 14 }} />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{broker.rating || '—'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>({reviews.length} reviews)</span>
                </div>
              </div>
              <div>
                <InfoRow label="Name" value={broker.name} />
                {broker.mc    && <InfoRow label="MC Number"    value={broker.mc} />}
                {broker.phone && <InfoRow label="Phone"        value={formatPhone(broker.phone)} />}
                <InfoRow label="Role" value="Broker" />
                <InfoRow label="Avg Rate/Mile" value={`$${broker.avgRate}/mi`} />
                {broker.paySpeed && <InfoRow label="Pay Speed" value={broker.paySpeed} />}
                {avgPaymentDays && <InfoRow label={`Carrier-Verified Pay Avg (${allPaymentDays.length} reports)`} value={`${avgPaymentDays} days avg`} />}
                {broker.vetting_status && broker.vetting_status !== 'pending' && (
                  <InfoRow label="Status"
                    value={broker.vetting_status === 'verified' ? '✓ Verified'
                      : broker.vetting_status === 'flagged' ? '⚠ Flagged' : '⏳ Under Review'}
                  />
                )}
                {broker.warns > 0 && <InfoRow label="Warning Flags" value={`${broker.warns} active`} />}
              </div>
            </div>

            {/* Actions */}
            {!isOwner && (
              <div style={cardStyle}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>Actions</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {user?.role === 'carrier' && !networkState.loading && (
                    networkState.status === 'accepted' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ion-color-primary)', border: '1px solid var(--ion-color-primary)', borderRadius: 10, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <IonIcon name="checkmark-outline" style={{ fontSize: 13 }} /> Connected
                      </span>
                    ) : networkState.status === 'pending' ? (
                      <span style={{ color: 'var(--ion-color-warning)', border: '1px solid var(--ion-color-warning)', borderRadius: 10, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>Request Sent</span>
                    ) : (
                      <button onClick={handleConnect} disabled={networkConnecting} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)', background: 'none', borderRadius: 6, padding: '6px 12px', cursor: networkConnecting ? 'default' : 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.825rem' }}>
                        {networkConnecting ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name="person-add-outline" style={{ fontSize: 14 }} />}
                        Connect
                      </button>
                    )
                  )}
                  {user?.role === 'carrier' && !submitted && canReview?.can_review && (
                    <button onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.825rem' }}>
                      <IonIcon name="star" style={{ fontSize: 14 }} /> Write a Review
                    </button>
                  )}
                  {user?.role === 'carrier' && !submitted && canReview && !canReview.can_review && (
                    <span style={{ color: 'var(--ion-color-medium)', border: '1px solid var(--ion-border-color)', borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>{canReview.reason || 'Review unavailable'}</span>
                  )}
                  {submitted && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2dd36f', border: '1px solid rgba(45,211,111,0.4)', borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                      <IonIcon name="checkmark-circle" style={{ fontSize: 12 }} /> Review submitted
                    </span>
                  )}
                  <button onClick={handleToggleBlock} disabled={blockLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${isBlocked ? 'var(--ion-color-danger)' : 'var(--ion-border-color)'}`, color: isBlocked ? 'var(--ion-color-danger)' : 'var(--ion-color-medium)', background: 'none', borderRadius: 6, padding: '6px 12px', cursor: blockLoading ? 'default' : 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.825rem' }}>
                    {blockLoading ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : <IonIcon name={isBlocked ? 'shield-outline' : 'ban-outline'} style={{ fontSize: 14 }} />}
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            )}

            {/* Rating Breakdown */}
            {reviews.length > 0 && (
              <div style={cardStyle}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>Rating Breakdown</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SubRating label="Communication" value={avgComm} />
                  <SubRating label="Load Accuracy" value={avgAcc} />
                  {wwaPct !== null && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: wwaPct >= 80 ? '#2dd36f' : wwaPct >= 60 ? 'var(--ion-color-warning)' : 'var(--ion-color-danger)', border: `1px solid ${wwaPct >= 80 ? 'rgba(45,211,111,0.4)' : wwaPct >= 60 ? 'rgba(255,196,9,0.4)' : 'rgba(235,68,90,0.4)'}`, borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600, alignSelf: 'flex-start' }}>
                      <IonIcon name="thumbs-up-outline" style={{ fontSize: 12 }} /> {wwaPct}% would work again
                    </span>
                  )}
                  <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 2, width: 60 }}>
                            {[1,2,3,4,5].map(i => <IonIcon key={i} name={i <= star ? 'star' : 'star-outline'} style={{ fontSize: 10, color: i <= star ? '#FFC107' : 'var(--ion-color-medium)' }} />)}
                          </div>
                          <MiniBar value={pct} max={100} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', width: 16, textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!isOwner && user?.role === 'carrier' && !submitted && !showForm && canReview?.can_review && (
            <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
              <IonIcon name="star" style={{ fontSize: 14 }} /> Write a Review
            </button>
          )}
          {submitted && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2dd36f', border: '1px solid rgba(45,211,111,0.4)', borderRadius: 10, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600, alignSelf: 'flex-start' }}>
              <IonIcon name="checkmark-circle" style={{ fontSize: 14 }} /> Review submitted
            </span>
          )}

          {/* Review Form */}
          {showForm && (
            <div style={{ ...cardStyle, border: '1px solid var(--ion-color-primary)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>Your Review of {broker.name}</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>Overall Rating *</div>
                  <StarInput value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={28} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>Communication</div>
                    <StarInput value={form.communication} onChange={v => setForm(f => ({ ...f, communication: v }))} size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>Load Accuracy</div>
                    <StarInput value={form.accuracy} onChange={v => setForm(f => ({ ...f, accuracy: v }))} size={22} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Actual payment received in (days)</label>
                    <input type="number" min={1} max={180} placeholder="e.g. 21" value={form.paymentDays} onChange={e => setForm(f => ({ ...f, paymentDays: e.target.value }))} style={inputStyle} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginTop: 3 }}>Helps verify pay speed for other drivers</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>Would you work with them again?</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setForm(f => ({ ...f, wouldWorkAgain: true }))} style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--ion-color-primary)', backgroundColor: form.wouldWorkAgain === true ? 'var(--ion-color-primary)' : 'transparent', color: form.wouldWorkAgain === true ? '#fff' : 'var(--ion-color-primary)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.8rem' }}>
                        <IonIcon name="thumbs-up-outline" style={{ fontSize: 14 }} /> Yes
                      </button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, wouldWorkAgain: false }))} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${form.wouldWorkAgain === false ? 'var(--ion-color-danger)' : 'var(--ion-border-color)'}`, backgroundColor: form.wouldWorkAgain === false ? 'var(--ion-color-danger)' : 'transparent', color: form.wouldWorkAgain === false ? '#fff' : 'var(--ion-color-medium)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.8rem' }}>
                        <IonIcon name="thumbs-down-outline" style={{ fontSize: 14 }} /> No
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Your experience</label>
                  <textarea rows={3} placeholder="Tell other drivers about your experience with this broker..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', color: 'var(--ion-text-color)', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                  <button type="button" onClick={handleSubmitReview} disabled={form.rating === 0} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: form.rating === 0 ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.875rem', opacity: form.rating === 0 ? 0.5 : 1 }}>Submit Review</button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews list */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>Carrier Reviews</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{reviews.length}</span>
            </div>
            {loadingReviews ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><IonSpinner name="crescent" style={{ width: 24, height: 24 }} /></div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <IonIcon name="chatbubble-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No reviews yet. Be the first to review this broker.</p>
              </div>
            ) : (
              <div>
                {reviews.map((review, idx) => (
                  <div key={review.id} style={{ padding: '16px 20px', borderBottom: idx < reviews.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>
                            {review.isAnonymous ? '?' : review.carrierName?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
                            {review.isAnonymous ? 'Anonymous Driver' : review.carrierName}
                          </span>
                          {review.wouldWorkAgain === true  && <span style={{ color: '#2dd36f', border: '1px solid rgba(45,211,111,0.4)', borderRadius: 10, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 600 }}>✓ Would work again</span>}
                          {review.wouldWorkAgain === false && <span style={{ color: 'var(--ion-color-danger)', border: '1px solid rgba(235,68,90,0.4)', borderRadius: 10, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 600 }}>✗ Would not work again</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {[1,2,3,4,5].map(n => <IonIcon key={n} name={n <= review.rating ? 'star' : 'star-outline'} style={{ fontSize: 12, color: n <= review.rating ? '#FFC107' : 'var(--ion-color-medium)' }} />)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>{review.rating}.0</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>· {new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {review.paymentDays && (
                        <div style={{ padding: '8px 16px', textAlign: 'center', border: `1px solid ${review.paymentDays <= 21 ? 'var(--ion-color-primary)' : review.paymentDays <= 35 ? 'var(--ion-color-warning)' : 'var(--ion-color-danger)'}`, borderRadius: 6 }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)' }}>Paid in</div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: review.paymentDays <= 21 ? 'var(--ion-color-primary)' : review.paymentDays <= 35 ? 'var(--ion-color-warning)' : 'var(--ion-color-danger)' }}>{review.paymentDays} days</div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: review.comment ? 12 : 0 }}>
                      <SubRating label="Communication" value={review.communication} />
                      <SubRating label="Load Accuracy" value={review.accuracy} />
                    </div>
                    {review.comment && <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Speed Tab */}
      {activeTab === 'pay_speed' && (
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ ...cardStyle, border: `1px solid ${paySpeedVerified ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, backgroundColor: paySpeedVerified ? (isDark ? 'rgba(21,101,192,0.08)' : 'rgba(21,101,192,0.04)') : 'var(--ion-card-background)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <IonIcon name="time-outline" style={{ color: paySpeedVerified ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>Pay Speed</span>
              <span style={{ color: paySpeedVerified ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', border: `1px solid ${paySpeedVerified ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                {paySpeedVerified ? '✓ Carrier-Verified' : 'Self-Reported'}
              </span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginBottom: 2 }}>Broker self-reported</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: broker.paySpeed === 'Quick-Pay' ? 'var(--ion-color-primary)' : 'var(--ion-text-color)' }}>{broker.paySpeed}</div>
                </div>
                {avgPaymentDays && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginBottom: 2 }}>Carrier-reported avg ({allPaymentDays.length} reports)</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: avgPaymentDays <= 21 ? 'var(--ion-color-primary)' : avgPaymentDays <= 35 ? 'var(--ion-color-warning)' : 'var(--ion-color-danger)' }}>{avgPaymentDays} days avg</div>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>
                {paySpeedVerified
                  ? `Pay speed is calculated from ${allPaymentDays.length} carriers who reported their actual payment time.`
                  : 'Pay speed is self-declared by the broker. It will be verified once 3+ carriers report in reviews.'}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
