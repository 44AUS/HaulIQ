import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';

export default function Login() {
  const [params] = useSearchParams();
  const defaultRole = params.get('role') || '';
  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setError && setError(null); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password, role || undefined);
    if (ok) {
      const resolvedRole = role || (email === 'admin@urload.app' ? 'admin' : 'carrier');
      if (resolvedRole === ROLES.ADMIN) navigate('/admin');
      else if (resolvedRole === ROLES.BROKER) navigate('/broker/dashboard');
      else navigate('/carrier/dashboard');
    }
  };

  const DEMO_ACCOUNTS = [
    { role: 'carrier', email: 'carrier@demo.com', pw: 'demo1234', label: 'Carrier Demo' },
    { role: 'broker',  email: 'broker@demo.com',  pw: 'demo1234', label: 'Broker Demo' },
    { role: 'admin',   email: 'admin@urload.app', pw: 'demo1234', label: 'Admin Demo' },
  ];

  const fillDemo = (acc) => {
    setRole(acc.role);
    setEmail(acc.email);
    setPassword(acc.pw);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.06)_0%,transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center glow-green-sm">
            <Truck size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-2xl">Ur<span className="gradient-text">load</span></span>
        </Link>

        <div className="glass rounded-2xl border border-dark-400/40 p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-dark-200 text-sm mb-6">Sign in to your Urload account</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[['carrier', '🚛', 'Driver'], ['broker', '📋', 'Broker'], ['admin', '⚙️', 'Admin']].map(([r, icon, label]) => (
              <button key={r} onClick={() => setRole(r)}
                className={`py-2.5 rounded-lg text-xs font-medium transition-all border ${
                  role === r
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                    : 'border-dark-400/50 text-dark-300 hover:border-dark-300 hover:text-white'
                }`}>
                <span className="block text-lg mb-0.5">{icon}</span>{label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-white">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 glow-green disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Sign In</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-dark-300 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">Sign up free</Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 glass rounded-xl border border-dark-400/30 p-4">
          <p className="text-dark-300 text-xs text-center mb-3 font-medium uppercase tracking-wider">Quick Demo Access</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.role} onClick={() => fillDemo(acc)}
                className="py-2 px-3 bg-dark-700/60 hover:bg-dark-600 rounded-lg text-xs text-dark-100 hover:text-white transition-colors capitalize border border-dark-400/30">
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
