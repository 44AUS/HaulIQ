import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, ArrowRight, ArrowLeft, Check, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const CARRIER_PLANS_BRIEF = [
  { id: 'basic', name: 'Basic', price: '$0/mo', perks: ['20 loads/day', 'Basic calculator'] },
  { id: 'pro',   name: 'Pro',   price: '$49/mo', perks: ['Unlimited loads', 'Earnings Brain', 'Broker ratings'], popular: true },
  { id: 'elite', name: 'Elite', price: '$99/mo', perks: ['Full AI insights', 'Early access', 'Analytics'] },
];
const BROKER_PLANS_BRIEF = [
  { id: 'basic', name: 'Basic', price: '$0/mo', perks: ['10 postings', 'Basic visibility'] },
  { id: 'pro',   name: 'Pro',   price: '$79/mo', perks: ['50 postings', 'Enhanced ranking'], popular: true },
  { id: 'elite', name: 'Elite', price: '$149/mo', perks: ['Unlimited', 'Priority placement', 'Analytics'] },
];

export default function Signup() {
  const [params] = useSearchParams();
  const initRole = params.get('role') || '';
  const [step, setStep] = useState(initRole ? 1 : 0);
  const [role, setRole] = useState(initRole);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '', mc: '' });
  const [plan, setPlan] = useState('basic');
  const { signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  // MC verification state
  const [mcState, setMcState] = useState(null); // null | 'checking' | {valid, legal_name, error}
  const mcTimerRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setError && setError(null); }, [step]);

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleMcChange = (val) => {
    updateForm('mc', val);
    setMcState(null);
    clearTimeout(mcTimerRef.current);
    const stripped = val.replace(/[^0-9]/g, '');
    if (stripped.length < 4) return;
    setMcState('checking');
    mcTimerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.verifyMc(val);
        setMcState({ valid: true, legal_name: res.legal_name, operating_status: res.operating_status });
      } catch (err) {
        setMcState({ valid: false, error: err.message });
      }
    }, 700);
  };

  // Block advancing if MC was entered but is invalid
  const mcBlocking = form.mc && mcState && mcState !== 'checking' && !mcState.valid;

  const plans = role === 'broker' ? BROKER_PLANS_BRIEF : CARRIER_PLANS_BRIEF;
  const selectedPlanObj = plans.find(p => p.id === plan);
  const isPaid = selectedPlanObj && selectedPlanObj.price !== '$0/mo';

  const handleSignup = async () => {
    const result = await signup({ ...form, role, plan });
    if (result) {
      if (isPaid && result.planId) {
        navigate(`/checkout?plan_id=${result.planId}`);
      } else {
        setStep(3);
      }
    }
  };

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

        {/* Progress */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-8 justify-center">
            {['Role', 'Info', 'Plan'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? 'text-brand-400' : 'text-dark-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                    i < step ? 'bg-brand-500 border-brand-500 text-white' :
                    i === step ? 'border-brand-500 text-brand-400' :
                    'border-dark-400 text-dark-400'
                  }`}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  {s}
                </div>
                {i < 2 && <div className={`h-px flex-1 max-w-[40px] ${i < step ? 'bg-brand-500' : 'bg-dark-600'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="glass rounded-2xl border border-dark-400/40 p-8">
          {/* Step 0: Role */}
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Join Urload</h1>
              <p className="text-dark-200 text-sm mb-7">What best describes you?</p>
              <div className="grid gap-4">
                {[
                  { r: 'carrier', icon: '🚛', title: 'I\'m a Driver / Carrier', desc: 'Find profitable loads, track earnings, and grow your trucking business.' },
                  { r: 'broker', icon: '📋', title: 'I\'m a Freight Broker', desc: 'Post loads, reach serious carriers, and track performance.' },
                ].map(({ r, icon, title, desc }) => (
                  <button key={r} onClick={() => { setRole(r); setStep(1); }}
                    className={`text-left p-5 rounded-xl border transition-all hover:border-brand-500/40 hover:bg-brand-500/5 ${role === r ? 'border-brand-500/40 bg-brand-500/5' : 'border-dark-400/40'}`}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <p className="text-white font-semibold text-sm mb-1">{title}</p>
                    <p className="text-dark-300 text-xs leading-relaxed">{desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-center text-dark-300 text-sm mt-6">
                Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
              </p>
            </div>
          )}

          {/* Step 1: Info */}
          {step === 1 && (
            <div>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-dark-300 hover:text-white text-sm mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
              <p className="text-dark-200 text-sm mb-6 capitalize">Signing up as a {role}</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Full Name</label>
                  <input className="input" placeholder="Your full name" value={form.name}
                    onChange={e => updateForm('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">
                    {role === 'broker' ? 'Brokerage Name' : 'Company / DBA Name'}
                  </label>
                  <input className="input" placeholder={role === 'broker' ? 'FastFreight LLC' : 'Rodriguez Trucking'}
                    value={form.company} onChange={e => updateForm('company', e.target.value)} />
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">
                    MC Number
                    <span className="text-dark-400 font-normal"> (optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      className={`input pr-10 ${
                        mcState === 'checking' ? '' :
                        mcState?.valid   ? 'border-brand-500/60' :
                        mcState?.error   ? 'border-red-500/60' : ''
                      }`}
                      placeholder="MC-123456"
                      value={form.mc}
                      onChange={e => handleMcChange(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {mcState === 'checking' && <Loader size={15} className="text-dark-400 animate-spin" />}
                      {mcState?.valid  && <Check size={15} className="text-brand-400" />}
                      {mcState?.error  && <AlertCircle size={15} className="text-red-400" />}
                    </div>
                  </div>
                  {mcState?.valid && mcState.legal_name && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-400">
                      <Check size={11} />
                      <span className="font-medium">{mcState.legal_name}</span>
                      {mcState.operating_status && <span className="text-brand-400/60">· {mcState.operating_status}</span>}
                    </div>
                  )}
                  {mcState?.error && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {mcState.error}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Phone Number</label>
                  <input type="tel" className="input" placeholder="+1 (555) 000-0000" value={form.phone}
                    onChange={e => updateForm('phone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Email</label>
                  <input type="email" className="input" placeholder="you@example.com" value={form.email}
                    onChange={e => updateForm('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Password</label>
                  <input type="password" className="input" placeholder="At least 8 characters" value={form.password}
                    onChange={e => updateForm('password', e.target.value)} />
                </div>
              </div>
              <button
                onClick={() => { if (form.name && form.phone && form.email && form.password && !mcBlocking) setStep(2); }}
                disabled={mcBlocking || mcState === 'checking'}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3 glow-green disabled:opacity-50 disabled:cursor-not-allowed">
                {mcState === 'checking' ? <Loader size={16} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
              </button>
            </div>
          )}

          {/* Step 2: Plan */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-dark-300 hover:text-white text-sm mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <h1 className="text-2xl font-bold text-white mb-1">Choose your plan</h1>
              <p className="text-dark-200 text-sm mb-6">Start free. Upgrade anytime.</p>

              <div className="space-y-3 mb-6">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setPlan(p.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      plan === p.id ? 'border-brand-500/40 bg-brand-500/5' : 'border-dark-400/40 hover:border-dark-300/60'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${plan === p.id ? 'border-brand-500 bg-brand-500' : 'border-dark-400'}`}>
                          {plan === p.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-white font-semibold text-sm">{p.name}</span>
                        {p.popular && <span className="badge-green text-xs py-0.5">Popular</span>}
                      </div>
                      <span className="text-white text-sm font-bold">{p.price}</span>
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 ml-6">
                      {p.perks.map(perk => (
                        <li key={perk} className="flex items-center gap-1 text-dark-300 text-xs">
                          <Check size={10} className="text-brand-400" />{perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <button onClick={handleSignup} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 glow-green disabled:opacity-50">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><span>{isPaid ? 'Continue to Payment' : 'Create Account'}</span><ArrowRight size={16} /></>
                )}
              </button>
              <p className="text-dark-400 text-xs text-center mt-4">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-5 glow-green">
                <Check size={28} className="text-brand-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to Urload!</h1>
              <p className="text-dark-200 text-sm mb-8">Your account is ready. Let's start making you more money.</p>
              <button
                onClick={() => navigate(role === 'broker' ? '/broker/dashboard' : '/carrier/dashboard')}
                className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto glow-green">
                Go to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
