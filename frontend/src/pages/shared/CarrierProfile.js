import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useSearchParams, Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
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
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
          <IonIcon name={(hover || value) >= i ? 'star' : 'star-outline'} style={{ fontSize: size, color: (hover || value) >= i ? '#FFC107' : 'var(--ion-color-medium)' }} />
        </button>
      ))}
    </div>
  );
}

function MiniBar({ value, max = 5 }) {
  if (!value) return <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>—</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 6, borderRadius: 3, backgroundColor: 'var(--ion-color-light)', overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', backgroundColor: 'var(--ion-color-primary)', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{value}</span>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', lineHeight: 1.3 }}>{label}</div>
      {value && <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>}
    </div>
  </div>
);

export default function CarrierProfile() {
  const { carrierId: carrierIdParam } = useParams();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const carrierId = state?.carrierId || carrierIdParam;
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const activeTab = searchParams.get('tab') || 'overview';

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
      rating: form.rating, communication: form.communication || null,
      on_time_pickup: form.onTimePickup || null, on_time_delivery: form.onTimeDelivery || null,
      load_care: form.loadCare || null, would_work_again: form.wouldWorkAgain,
      comment: form.comment || null, is_anonymous: false,
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

  const Badge = ({ label, bg, color, icon }) => (
    <span style={{ backgroundColor: bg, color, borderRadius: 10, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon && <IonIcon name={icon} style={{ fontSize: 12 }} />}{label}
    </span>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div style={{ paddingTop: 8, paddingBottom: 8, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>

          {/* Left: Photo */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 400, height: 400, borderRadius: 10, overflow: 'hidden', backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stats?.avatar_url
                ? <img src={stats.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '5rem', fontWeight: 300, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}>{displayName.charAt(0)}</span>
              }
            </div>
          </div>

          {/* Right: Info cards */}
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Carrier Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Carrier Info</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IonIcon name="star" style={{ color: '#FFC107', fontSize: 15 }} />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{avgOverall}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>({reviews.length} reviews)</span>
                </div>
              </div>
              <div>
                <InfoRow label="Name" value={displayName} />
                {stats?.company && stats?.name && stats.company !== stats.name && <InfoRow label="Company" value={stats.company} />}
                {stats?.phone     && <InfoRow label="Phone"      value={formatPhone(stats.phone)} />}
                {stats?.mc_number && <InfoRow label="MC Number"  value={`MC-${stats.mc_number}`} />}
                <InfoRow label="Role" value="Carrier" />
                {stats?.vetting_status && stats.vetting_status !== 'pending' && (
                  <InfoRow label="Status" value={stats.vetting_status === 'verified' ? '✓ Verified' : stats.vetting_status === 'flagged' ? '⚠ Flagged' : '⏳ Under Review'} />
                )}
              </div>
            </div>

            {/* Actions (broker only) */}
            {user?.role === 'broker' && (
              <div style={cardStyle}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Actions</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  {!networkState.loading && (
                    networkState.status === 'accepted' ? (
                      <Badge label="In Network" bg="rgba(56,128,255,0.1)" color="var(--ion-color-primary)" icon="checkmark-outline" />
                    ) : networkState.status === 'pending' ? (
                      <Badge label="Request Sent" bg="rgba(255,196,9,0.1)" color="var(--ion-color-warning)" />
                    ) : (
                      <button onClick={handleAddToNetwork} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit' }}>
                        <IonIcon name="wifi-outline" style={{ fontSize: 15 }} /> Add to Network
                      </button>
                    )
                  )}
                  {(submitted || canReviewReason === 'already_reviewed') ? (
                    <Badge label="Reviewed" bg="rgba(45,211,111,0.1)" color="#2dd36f" icon="checkmark-circle" />
                  ) : canReview ? (
                    <button onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit' }}>
                      <IonIcon name="star" style={{ fontSize: 15 }} /> Review
                    </button>
                  ) : canReviewReason === 'no_completed_load' ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)', border: '1px solid var(--ion-border-color)', borderRadius: 10, padding: '3px 10px' }}>Complete a load to review</span>
                  ) : null}
                  <button onClick={handleToggleBlock} disabled={blockLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${isBlocked ? 'var(--ion-color-danger)' : 'var(--ion-border-color)'}`, color: isBlocked ? 'var(--ion-color-danger)' : 'var(--ion-text-color)', borderRadius: 6, padding: '6px 14px', cursor: blockLoading ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit', opacity: blockLoading ? 0.7 : 1 }}>
                    {blockLoading ? <IonSpinner name="crescent" style={{ width: 12, height: 12 }} /> : <IonIcon name={isBlocked ? 'shield-outline' : 'ban-outline'} style={{ fontSize: 15 }} />}
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            )}

            {/* Rating Breakdown */}
            {reviews.length > 0 && (
              <div style={cardStyle}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Rating Breakdown</span>
                </div>
                <div>
                  {[
                    { label: 'Communication',    value: _avg('communication') },
                    { label: 'On-Time Pickup',   value: _avg('onTimePickup') },
                    { label: 'On-Time Delivery', value: _avg('onTimeDelivery') },
                    { label: 'Load Care',        value: _avg('loadCare') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{label}</span>
                      <MiniBar value={value} />
                    </div>
                  ))}
                  {wwaPct !== null && (
                    <div style={{ padding: '12px 24px' }}>
                      <Badge
                        label={`${wwaPct}% of brokers would book again`}
                        bg={wwaPct >= 80 ? 'rgba(45,211,111,0.1)' : wwaPct >= 60 ? 'rgba(255,196,9,0.1)' : 'rgba(235,68,90,0.1)'}
                        color={wwaPct >= 80 ? '#2dd36f' : wwaPct >= 60 ? '#ffc409' : '#eb445a'}
                        icon="thumbs-up-outline"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
        <div style={{ paddingTop: 8, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {user?.role === 'broker' && !submitted && !showForm && (
            canReviewReason === 'already_reviewed' ? (
              <Badge label="Reviewed" bg="rgba(45,211,111,0.1)" color="#2dd36f" icon="checkmark-circle" />
            ) : canReview ? (
              <button onClick={() => setShowForm(true)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                <IonIcon name="star" style={{ fontSize: 15 }} /> Write a Review
              </button>
            ) : null
          )}
          {submitted && <Badge label="Review submitted" bg="rgba(45,211,111,0.1)" color="#2dd36f" icon="checkmark-circle" />}

          {/* Review Form */}
          {showForm && (
            <div style={{ ...cardStyle, border: '1px solid var(--ion-color-primary)', marginBottom: 8 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Review {displayName}</span>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>Overall Rating *</div>
                  <StarInput value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={28} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { key: 'communication',  label: 'Communication' },
                    { key: 'onTimePickup',   label: 'On-Time Pickup' },
                    { key: 'onTimeDelivery', label: 'On-Time Delivery' },
                    { key: 'loadCare',       label: 'Load Care / No Damage' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>{label}</div>
                      <StarInput value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} size={20} />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 8 }}>Would you book this carrier again?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ val: true, label: 'Yes', icon: 'thumbs-up-outline' }, { val: false, label: 'No', icon: 'thumbs-down-outline' }].map(({ val, label, icon }) => (
                      <button key={String(val)} onClick={() => setForm(f => ({ ...f, wouldWorkAgain: val }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: form.wouldWorkAgain === val ? (val ? 'var(--ion-color-primary)' : 'var(--ion-color-danger)') : 'transparent', color: form.wouldWorkAgain === val ? '#fff' : 'var(--ion-text-color)', border: `1px solid ${form.wouldWorkAgain === val ? (val ? 'var(--ion-color-primary)' : 'var(--ion-color-danger)') : 'var(--ion-border-color)'}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit' }}>
                        <IonIcon name={icon} style={{ fontSize: 14 }} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Your experience</label>
                  <textarea rows={3} placeholder="Describe reliability, professionalism, any issues..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                  <button onClick={handleSubmit} disabled={form.rating === 0} style={{ backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: form.rating === 0 ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: form.rating === 0 ? 0.5 : 1 }}>Submit Review</button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews list */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Broker Reviews</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{reviews.length}</span>
            </div>
            {loadingReviews ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <IonIcon name="people-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No reviews yet for this carrier.</span>
              </div>
            ) : (
              <div>
                {reviews.map((review, idx) => (
                  <div key={review.id} style={{ padding: '16px 20px', borderBottom: idx < reviews.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary-shade)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {review.brokerName.charAt(0)}
                      </div>
                      {review.brokerId ? (
                        <Link to={`/b/${review.brokerId.slice(0, 8)}`} state={{ brokerId: review.brokerId }} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', textDecoration: 'none' }}>
                          {review.brokerName}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{review.brokerName}</span>
                      )}
                      {review.wouldWorkAgain === true  && <Badge label="✓ Would book again"    bg="rgba(45,211,111,0.1)" color="#2dd36f" />}
                      {review.wouldWorkAgain === false && <Badge label="✗ Would not book again" bg="rgba(235,68,90,0.1)"  color="#eb445a" />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                      {[1,2,3,4,5].map(n => (
                        <IonIcon key={n} name={n <= review.rating ? 'star' : 'star-outline'} style={{ fontSize: 13, color: n <= review.rating ? '#FFC107' : 'var(--ion-color-medium)' }} />
                      ))}
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ion-text-color)', marginLeft: 2 }}>{review.rating}.0</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>· {new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {[
                      { label: 'Communication', value: review.communication },
                      { label: 'On-Time Pickup', value: review.onTimePickup },
                      { label: 'On-Time Delivery', value: review.onTimeDelivery },
                      { label: 'Load Care', value: review.loadCare },
                    ].filter(x => x.value).length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
                        {[
                          { label: 'Communication', value: review.communication },
                          { label: 'On-Time Pickup', value: review.onTimePickup },
                          { label: 'On-Time Delivery', value: review.onTimeDelivery },
                          { label: 'Load Care', value: review.loadCare },
                        ].filter(x => x.value).map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginBottom: 4 }}>{label}</div>
                            <MiniBar value={value} />
                          </div>
                        ))}
                      </div>
                    )}
                    {review.comment && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
