import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, AlertCircle, Loader, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TIER_ORDER = { basic: 0, pro: 1, elite: 2 };

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
      // Free plan — switch immediately
      fetch(`${API}/api/subscriptions/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: plan.id }),
      }).then(() => navigate(`/${user.role}/dashboard`));
      return;
    }
    // Paid plan — go through Adyen checkout
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader size={24} className="text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Manage Subscription</h1>
        <p className="text-dark-300 text-sm mt-1">
          {currentSub
            ? `Currently on ${currentSub.plan.name} · renews ${new Date(currentSub.current_period_end).toLocaleDateString()}`
            : 'No active subscription'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Status badge */}
      {currentSub?.status === 'past_due' && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle size={15} className="text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-400 text-sm">
            Your payment is past due. Update your payment method to keep access.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        {plans.map(plan => {
          const isCurrent = currentSub?.plan?.id === plan.id;
          const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[currentTier];
          const isDowngrade = TIER_ORDER[plan.tier] < TIER_ORDER[currentTier];

          return (
            <div key={plan.id}
              className={`glass rounded-2xl border p-6 flex flex-col transition-all ${
                isCurrent
                  ? 'border-brand-500/40 bg-brand-500/5'
                  : 'border-dark-400/40 hover:border-dark-300/60'
              }`}>
              {isCurrent && (
                <span className="badge-green text-xs self-start mb-3">Current Plan</span>
              )}
              {plan.tier === 'pro' && !isCurrent && (
                <span className="badge-yellow text-xs self-start mb-3">Most Popular</span>
              )}
              <p className="text-white font-bold text-lg mb-1">{plan.name}</p>
              <p className="text-dark-300 text-sm mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-white font-bold text-3xl">${plan.price}</span>
                <span className="text-dark-400 text-sm">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-dark-200 text-sm">
                    <Check size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="text-center text-dark-400 text-sm py-2">Active</div>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    isUpgrade
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'border border-dark-400/60 text-dark-200 hover:border-dark-300 hover:text-white'
                  }`}>
                  {plan.price > 0 && <CreditCard size={14} />}
                  {isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel */}
      {currentSub && currentSub.status !== 'cancelled' && currentTier !== 'basic' && (
        <div className="glass rounded-xl border border-dark-400/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Cancel Subscription</p>
            <p className="text-dark-400 text-xs mt-0.5">You'll be downgraded to Basic at the end of your billing period.</p>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm transition-all">
            Cancel Plan
          </button>
        </div>
      )}

      {/* Cancel confirm modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-dark-400/40 rounded-2xl p-8 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Cancel Subscription?</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-dark-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-dark-300 text-sm mb-6 leading-relaxed">
              Your {currentSub.plan.name} plan will remain active until{' '}
              <strong className="text-white">{new Date(currentSub.current_period_end).toLocaleDateString()}</strong>,
              then you'll be moved to the free Basic plan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-dark-400/60 text-dark-200 hover:text-white py-2.5 rounded-xl text-sm transition-all">
                Keep Plan
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
