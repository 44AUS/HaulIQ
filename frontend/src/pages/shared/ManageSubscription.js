import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import IonIcon from '../../components/IonIcon';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const TIER_ORDER = { basic: 0, pro: 1, elite: 2 };

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };

export default function ManageSubscription() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/subscriptions/plans?role=${user.role}`, { headers }).then(r => r.json()),
      fetch(`${API}/api/subscriptions/me`, { headers }).then(r => r.json()),
    ])
      .then(([p, s]) => {
        setPlans(Array.isArray(p) ? p : []);
        setCurrentSub(s && !s.detail ? s : null);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load subscription info.'); setLoading(false); });
  }, [token, user.role]);

  const handleSelectPlan = (plan) => {
    if (plan.price === 0) {
      fetch(`${API}/api/subscriptions/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: plan.id }),
      }).then(() => navigate(`/${user.role}/dashboard`));
      return;
    }
    navigate(`/checkout?plan_id=${plan.id}`);
  };

  const handleCancel = async () => {
    setCancelling(true);
    await fetch(`${API}/api/subscriptions/cancel`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCancelling(false);
    setShowCancelModal(false);
    navigate(`/${user.role}/dashboard`);
  };

  const currentTier = currentSub?.plan?.tier || 'basic';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 16, paddingBottom: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>Manage Subscription</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          {currentSub
            ? `Currently on ${currentSub.plan.name} · renews ${new Date(currentSub.current_period_end).toLocaleDateString()}`
            : 'No active subscription'}
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 24, padding: '10px 16px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.875rem' }}>{error}</div>
      )}

      {currentSub?.status === 'past_due' && (
        <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 6, backgroundColor: 'rgba(255,196,9,0.1)', border: '1px solid rgba(255,196,9,0.3)', color: 'var(--ion-color-warning)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon name="warning-outline" style={{ fontSize: 18 }} />
          Your payment is past due. Update your payment method to keep access.
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
        {plans.map(plan => {
          const isCurrent = currentSub?.plan?.id === plan.id;
          const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[currentTier];

          return (
            <div key={plan.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', borderColor: isCurrent ? 'var(--ion-color-primary)' : 'var(--ion-border-color)', backgroundColor: isCurrent ? 'rgba(21,101,192,0.04)' : 'var(--ion-card-background)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
                {isCurrent && <span style={{ backgroundColor: 'rgba(45,211,111,0.12)', color: '#2dd36f', borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, alignSelf: 'flex-start', marginBottom: 12 }}>Current Plan</span>}
                {plan.tier === 'pro' && !isCurrent && <span style={{ backgroundColor: 'rgba(255,196,9,0.12)', color: 'var(--ion-color-warning)', borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, alignSelf: 'flex-start', marginBottom: 12 }}>Most Popular</span>}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', marginBottom: 16 }}>{plan.description}</div>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>${plan.price}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>/mo</span>
                </div>
                <ul style={{ flex: 1, margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(plan.features || []).map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <IonIcon name="checkmark-outline" style={{ fontSize: 15, color: 'var(--ion-color-primary)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Active</div>
                ) : (
                  <button onClick={() => handleSelectPlan(plan)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', backgroundColor: isUpgrade ? 'var(--ion-color-primary)' : 'transparent', color: isUpgrade ? '#fff' : 'var(--ion-color-primary)', border: `1px solid var(--ion-color-primary)`, borderRadius: 6, padding: '9px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                    {plan.price > 0 && <IonIcon name="card-outline" style={{ fontSize: 16 }} />}
                    {isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel section */}
      {currentSub && currentSub.status !== 'cancelled' && currentTier !== 'basic' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Cancel Subscription</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>You'll be downgraded to Basic at the end of your billing period.</div>
            </div>
            <button onClick={() => setShowCancelModal(true)} style={{ background: 'none', border: '1px solid var(--ion-color-danger)', color: 'var(--ion-color-danger)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
              Cancel Plan
            </button>
          </div>
        </div>
      )}

      {/* Cancel confirm modal */}
      <IonModal isOpen={showCancelModal} onDidDismiss={() => setShowCancelModal(false)} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--ion-text-color)' }}>Cancel Subscription?</h3>
            <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 2 }}>
              <IonIcon name="close-outline" style={{ fontSize: 20 }} />
            </button>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.7 }}>
            Your {currentSub?.plan?.name} plan will remain active until{' '}
            <strong style={{ color: 'var(--ion-text-color)' }}>{currentSub ? new Date(currentSub.current_period_end).toLocaleDateString() : ''}</strong>
            , then you'll be moved to the free Basic plan.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCancelModal(false)} style={{ flex: 1, background: 'none', border: '1px solid var(--ion-border-color)', color: 'var(--ion-text-color)', borderRadius: 6, padding: '9px 0', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
              Keep Plan
            </button>
            <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, backgroundColor: 'var(--ion-color-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 0', cursor: cancelling ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: cancelling ? 0.7 : 1 }}>
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </IonModal>
    </div>
  );
}
