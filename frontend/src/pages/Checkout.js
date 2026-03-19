import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { Truck, Check, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Checkout() {
  const [params] = useSearchParams();
  const planId = params.get('plan_id');
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const dropinRef = useRef(null);
  const adyenInstance = useRef(null);

  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | paying | success | failed

  // Fetch checkout session from backend
  useEffect(() => {
    if (!planId || !token) return;

    const returnUrl = `${window.location.origin}/checkout/success?plan_id=${planId}`;

    fetch(`${API}/api/payments/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan_id: planId, return_url: returnUrl }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.detail) throw new Error(data.detail);
        setSession(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Could not start checkout. Please try again.');
        setLoading(false);
      });
  }, [planId, token]);

  // Mount Adyen Drop-in once session is ready
  useEffect(() => {
    if (!session || !dropinRef.current) return;

    let mounted = true;

    import('@adyen/adyen-web').then(({ default: AdyenCheckout }) => {
      if (!mounted) return;

      AdyenCheckout({
        environment: session.environment === 'LIVE' ? 'live' : 'test',
        clientKey: session.client_key,
        session: {
          id: session.session_id,
          sessionData: session.session_data,
        },
        onPaymentCompleted(result) {
          if (result.resultCode === 'Authorised' || result.resultCode === 'Pending') {
            setStatus('success');
          } else {
            setStatus('failed');
            setError(`Payment ${result.resultCode}. Please try a different payment method.`);
          }
        },
        onError(err) {
          console.error('Adyen error:', err);
          setStatus('failed');
          setError('Payment error. Please try again.');
        },
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            enableStoreDetails: true,
          },
        },
      }).then(checkout => {
        if (!mounted) return;
        adyenInstance.current = checkout;
        checkout.create('dropin').mount(dropinRef.current);
      });
    });

    return () => {
      mounted = false;
      if (adyenInstance.current) {
        try { adyenInstance.current.unmount(); } catch (_) {}
      }
    };
  }, [session]);

  if (!user) return <Navigate to="/login" replace />;
  if (!planId) return <Navigate to="/signup" replace />;

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,197,94,0.05)_0%,transparent_60%)]" />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center glow-green-sm">
            <Truck size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-2xl">Haul<span className="gradient-text">IQ</span></span>
        </Link>

        {/* Success state */}
        {status === 'success' && (
          <div className="glass rounded-2xl border border-dark-400/40 p-10 text-center">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-5 glow-green">
              <Check size={28} className="text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-dark-200 text-sm mb-2">Your subscription is now active.</p>
            <p className="text-dark-400 text-xs mb-8">
              You'll receive a confirmation email shortly. Your account has been upgraded.
            </p>
            <button
              onClick={() => navigate(user.role === 'broker' ? '/broker/dashboard' : '/carrier/dashboard')}
              className="btn-primary px-8 py-3 inline-flex items-center gap-2 glow-green">
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && status === 'idle' && (
          <div className="glass rounded-2xl border border-dark-400/40 p-10 text-center">
            <Loader size={28} className="text-brand-400 animate-spin mx-auto mb-4" />
            <p className="text-dark-200 text-sm">Setting up secure checkout...</p>
          </div>
        )}

        {/* Error state (no dropin) */}
        {error && !session && (
          <div className="glass rounded-2xl border border-dark-400/40 p-8">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <Link to={`/${user.role}/dashboard`} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Checkout form */}
        {session && status === 'idle' && (
          <div className="glass rounded-2xl border border-dark-400/40 overflow-hidden">
            {/* Plan summary */}
            <div className="px-8 pt-8 pb-5 border-b border-dark-400/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-xs uppercase tracking-wider mb-1">Subscribing to</p>
                  <p className="text-white font-bold text-lg">{session.plan.name}</p>
                  <p className="text-brand-400 text-sm capitalize">{session.plan.tier} plan</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-2xl">${session.plan.price}</p>
                  <p className="text-dark-400 text-xs">per month</p>
                </div>
              </div>
            </div>

            {/* Adyen Drop-in mount point */}
            <div className="px-8 py-6">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div ref={dropinRef} className="adyen-dropin-wrapper" />
            </div>

            <div className="px-8 pb-6 text-center">
              <p className="text-dark-400 text-xs">
                Secured by Adyen · Cancel anytime from your account settings
              </p>
            </div>
          </div>
        )}

        {/* Failed payment retry */}
        {status === 'failed' && (
          <div className="glass rounded-2xl border border-dark-400/40 p-8">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={() => { setStatus('idle'); setError(null); setSession(null); setLoading(true); }}
              className="btn-primary w-full py-3 mb-3">
              Try Again
            </button>
            <Link to={`/${user.role}/dashboard`}
              className="block text-center text-dark-300 hover:text-white text-sm transition-colors">
              Skip for now
            </Link>
          </div>
        )}
      </div>

      {/* Adyen Drop-in global styles */}
      <style>{`
        .adyen-checkout__dropin { font-family: inherit; }
        .adyen-checkout__payment-method { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1) !important; border-radius: 12px !important; margin-bottom: 8px; }
        .adyen-checkout__payment-method--selected { background: rgba(34,197,94,0.05) !important; border-color: rgba(34,197,94,0.3) !important; }
        .adyen-checkout__payment-method__header { color: #e2e8f0 !important; }
        .adyen-checkout__label__text { color: #94a3b8 !important; font-size: 12px !important; }
        .adyen-checkout__input { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; color: white !important; border-radius: 8px !important; }
        .adyen-checkout__input:focus { border-color: rgba(34,197,94,0.5) !important; box-shadow: 0 0 0 2px rgba(34,197,94,0.1) !important; }
        .adyen-checkout__button--pay { background: #22c55e !important; border-radius: 10px !important; font-weight: 600 !important; }
        .adyen-checkout__button--pay:hover { background: #16a34a !important; }
        .adyen-checkout__card__cardNumber__input, .adyen-checkout__card__exp-date__input, .adyen-checkout__card__cvc__input { color: white !important; }
      `}</style>
    </div>
  );
}
