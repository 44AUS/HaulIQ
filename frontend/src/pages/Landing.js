import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Star, TrendingUp, Zap, ArrowRight,
  Check, X, ChevronRight, BarChart2,
  Mail, User,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { waitlistApi } from '../services/api';

// ─── WAITLIST MODAL ─────────────────────────────────────────────────────────────
function WaitlistModal({ onClose }) {
  const [role, setRole] = useState('carrier');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    waitlistApi.join({ email, name, role })
      .then(() => setDone(true))
      .catch(err => { setError(err.message); setSubmitting(false); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl border border-dark-400/40 w-full max-w-md p-8 animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-5 glow-green">
              <Check size={28} className="text-brand-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">You're on the list!</h3>
            <p className="text-dark-300 text-sm">We'll reach out as soon as your spot opens up.</p>
            <button onClick={onClose} className="mt-6 btn-primary px-8 py-2.5 text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-white font-bold text-xl mb-1">Join the Waitlist</h3>
              <p className="text-dark-300 text-sm">Get early access to UrLoad and be first in line when we launch.</p>
            </div>
            <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-dark-400/40 mb-6">
              {[{ key: 'carrier', label: "🚛 I'm a Carrier" }, { key: 'broker', label: "📋 I'm a Broker" }].map(opt => (
                <button key={opt.key} type="button" onClick={() => setRole(opt.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === opt.key ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-1.5">Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-1.5">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={submitting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 glow-green disabled:opacity-60">
                {submitting ? 'Joining…' : <><span>Join Waitlist</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP MOCKUPS ────────────────────────────────────────────────────────────────
function MockLoadBoard() {
  return (
    <div style={{ background: '#0d1117', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(48,54,61,0.7)', boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(14,165,233,0.06)' }}>
      {/* Window chrome */}
      <div style={{ background: '#161b22', padding: '11px 16px', borderBottom: '1px solid rgba(48,54,61,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ color: '#6e7681', fontSize: 11 }}>Load Board — UrLoad</span>
        </div>
      </div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 12px 8px' }}>
        {[
          { l: "Today's Profit", v: '+$1,247', c: '#0ea5e9' },
          { l: 'Loads Available', v: '142', c: '#e6edf3' },
          { l: 'Avg $/mi', v: '$3.18', c: '#60a5fa' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background: '#1c2330', borderRadius: 8, padding: '9px 11px' }}>
            <p style={{ color: '#6e7681', fontSize: 9, marginBottom: 3 }}>{l}</p>
            <p style={{ color: c, fontWeight: 700, fontSize: 15 }}>{v}</p>
          </div>
        ))}
      </div>
      {/* Load cards */}
      <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { from: 'Chicago, IL', to: 'Detroit, MI', mi: '281 mi', rate: '$1,240', profit: '+$412', green: true },
          { from: 'Dallas, TX', to: 'Houston, TX', mi: '239 mi', rate: '$680', profit: '+$178', green: false },
          { from: 'Atlanta, GA', to: 'Nashville, TN', mi: '249 mi', rate: '$940', profit: '+$306', green: true },
          { from: 'Phoenix, AZ', to: 'Los Angeles, CA', mi: '372 mi', rate: '$1,560', profit: '+$498', green: true },
        ].map(({ from, to, mi, rate, profit, green }) => (
          <div key={from} style={{ background: '#161b22', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(48,54,61,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: green ? '#0ea5e9' : '#eab308', flexShrink: 0 }} />
              <div>
                <p style={{ color: '#e6edf3', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{from} → {to}</p>
                <p style={{ color: '#6e7681', fontSize: 9 }}>{mi} · {rate}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: green ? '#0ea5e9' : '#eab308', fontWeight: 700, fontSize: 13 }}>{profit}</p>
              <p style={{ color: green ? '#0ea5e9' : '#eab308', fontSize: 8, opacity: 0.65 }}>{green ? 'HIGH PROFIT' : 'FAIR'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockCalculator() {
  return (
    <div style={{ background: '#0d1117', borderRadius: 16, border: '1px solid rgba(48,54,61,0.7)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', padding: 28 }}>
      <p style={{ color: '#e6edf3', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Profit Calculator</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Load Rate', value: '$1,240' },
          { label: 'Distance', value: '281 miles' },
          { label: 'Fuel Cost (est.)', value: '$312' },
          { label: 'Deadhead Miles', value: '22 miles' },
          { label: 'Deadhead Cost', value: '$38' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', borderRadius: 8, padding: '9px 14px' }}>
            <span style={{ color: '#6e7681', fontSize: 12 }}>{label}</span>
            <span style={{ color: '#e6edf3', fontWeight: 600, fontSize: 12 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ color: '#6e7681', fontSize: 11, marginBottom: 6 }}>Estimated Net Profit</p>
        <p style={{ color: '#0ea5e9', fontWeight: 800, fontSize: 38, lineHeight: 1 }}>+$412</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
          <span style={{ color: '#38bdf8', fontSize: 11 }}>$1.47 / mile</span>
          <span style={{ color: '#0ea5e9', fontSize: 11, fontWeight: 700 }}>✓ TAKE THIS LOAD</span>
        </div>
      </div>
    </div>
  );
}

function MockBrain() {
  return (
    <div style={{ background: '#0d1117', borderRadius: 16, border: '1px solid rgba(48,54,61,0.7)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 40, height: 40, background: 'rgba(14,165,233,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={20} style={{ color: '#0ea5e9' }} />
        </div>
        <div>
          <p style={{ color: '#e6edf3', fontWeight: 700, fontSize: 15 }}>Earnings Brain</p>
          <p style={{ color: '#6e7681', fontSize: 11 }}>AI insights for your route</p>
        </div>
        <span style={{ marginLeft: 'auto', background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(14,165,233,0.2)' }}>LIVE</span>
      </div>
      <div style={{ background: '#161b22', borderRadius: 10, padding: '14px 16px', marginBottom: 10, borderLeft: '3px solid #0ea5e9' }}>
        <p style={{ color: '#38bdf8', fontSize: 10, fontWeight: 700, marginBottom: 5 }}>💡 TOP RECOMMENDATION</p>
        <p style={{ color: '#e6edf3', fontSize: 12, lineHeight: 1.5 }}>Chicago → Detroit is your most profitable lane this week. Rates are 23% above average.</p>
      </div>
      <div style={{ background: '#161b22', borderRadius: 10, padding: '14px 16px', marginBottom: 14, borderLeft: '3px solid #ef4444' }}>
        <p style={{ color: '#f87171', fontSize: 10, fontWeight: 700, marginBottom: 5 }}>⚠️ BROKER ALERT</p>
        <p style={{ color: '#e6edf3', fontSize: 12, lineHeight: 1.5 }}>FastFreight LLC — 3 delayed payments this week. Community flagged. Avoid.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Best Day to Haul', val: 'Tuesday' },
          { label: 'Weekly Earnings', val: '+$3,840' },
          { label: 'Top Lane', val: 'CHI → DET' },
          { label: 'Profit vs Last Wk', val: '+18%' },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: '#1c2330', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ color: '#6e7681', fontSize: 9, marginBottom: 4 }}>{label}</p>
            <p style={{ color: '#e6edf3', fontWeight: 700, fontSize: 14 }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockBrokers() {
  return (
    <div style={{ background: '#0d1117', borderRadius: 16, border: '1px solid rgba(48,54,61,0.7)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', padding: 28 }}>
      <p style={{ color: '#e6edf3', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Broker Trust Scores</p>
      {[
        { name: 'RoadMaster Freight', score: 94, pay: '2.1 days avg', reviews: 312, badge: 'TRUSTED', c: '#0ea5e9' },
        { name: 'Swift Logistics Co.', score: 78, pay: '4.3 days avg', reviews: 187, badge: 'GOOD', c: '#eab308' },
        { name: 'FastFreight LLC', score: 31, pay: '11+ days avg', reviews: 94, badge: 'AVOID', c: '#ef4444' },
      ].map(({ name, score, pay, reviews, badge, c }) => (
        <div key={name} style={{ background: '#161b22', borderRadius: 10, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2.5px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: c, fontWeight: 800, fontSize: 15 }}>{score}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#e6edf3', fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{name}</p>
            <p style={{ color: '#6e7681', fontSize: 10 }}>⏱ {pay} · {reviews} reviews</p>
          </div>
          <span style={{ background: `${c}18`, color: c, fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: `1px solid ${c}35`, flexShrink: 0 }}>{badge}</span>
        </div>
      ))}
      <div style={{ background: '#1c2330', borderRadius: 10, padding: '12px 16px', marginTop: 4 }}>
        <p style={{ color: '#6e7681', fontSize: 10, marginBottom: 6 }}>Community Red Flags This Week</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Late payment ×3', 'No response ×2', 'Rate cut ×1'].map(f => (
            <span key={f} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── APP STORE BADGES ───────────────────────────────────────────────────────────
function AppBadge({ type }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#000', border: '1.5px solid rgba(255,255,255,0.2)',
      borderRadius: 10, padding: '8px 18px', cursor: 'pointer',
    }}>
      {type === 'google' ? (
        <>
          <svg width="20" height="22" viewBox="0 0 24 24"><path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6L13.14 7.7 3.18 23.76z" fill="#EA4335"/><path d="M21.3 10.12l-2.94-1.68-3.6 3.56 3.6 3.56 2.97-1.7c.85-.48.85-1.74-.03-1.74z" fill="#FBBC05"/><path d="M2.17.24A1.56 1.56 0 0 0 2 1v22c0 .27.07.52.18.74l13.41-13.4L2.17.24z" fill="#4285F4"/><path d="M4.17.44L16.77 7 13.14 10.7 3.18.24a1.56 1.56 0 0 1 .99.2z" fill="#34A853"/></svg>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, lineHeight: 1 }}>GET IT ON</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>Google Play</div>
          </div>
        </>
      ) : (
        <>
          <svg width="18" height="22" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.2S70 700.1 70 610.6c0-176.6 114.8-269.9 227.1-269.9 59.9 0 109.6 40.8 147.2 40.8 35.8 0 92.1-43.2 162.8-43.2zm-166.9-180.4c28.3-37 48.9-88.6 48.9-140.2 0-7.1-.6-14.3-1.9-20.1-46.3 1.8-101.5 31.7-134.8 72.2-26.1 30.7-50.6 82.4-50.6 134.9 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 41.7 0 93.1-28.4 122.9-67.3z" fill="#fff"/></svg>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, lineHeight: 1 }}>Download on the</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>App Store</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── WAVE TRANSITION ────────────────────────────────────────────────────────────
function WaveTransition() {
  const features = ['Smart Load Matching', 'Profit Calculator', 'Broker Ratings', 'Live Tracking', 'Rate Intelligence'];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % features.length), 2600);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', background: '#060b12', lineHeight: 0 }}>
      <svg viewBox="0 0 1440 110" style={{ display: 'block', width: '100%' }} preserveAspectRatio="none">
        <path d="M0,110 C240,30 480,90 720,50 C960,10 1200,75 1440,35 L1440,110 Z" fill="white" />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: 50, padding: '14px 30px',
        boxShadow: '0 6px 40px rgba(0,0,0,0.14)',
        display: 'flex', alignItems: 'center', gap: 10,
        whiteSpace: 'nowrap', lineHeight: 'normal',
      }}>
        <span style={{ color: '#111', fontWeight: 700, fontSize: 16 }}>I'm Looking For</span>
        <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 16 }}>{features[idx]}</span>
        <span style={{ color: '#0ea5e9', fontSize: 11 }}>▼</span>
      </div>
    </div>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────────
function Hero({ onWaitlist }) {
  return (
    <section style={{ background: '#060b12', position: 'relative', overflow: 'hidden', paddingTop: 62 }}>
      {/* Blue radial glow — top left */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 85% at -5% 45%, rgba(14,165,233,0.32) 0%, rgba(6,182,212,0.14) 38%, transparent 65%)',
      }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10" style={{ paddingTop: 80, paddingBottom: 100 }}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left ── */}
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(38px, 5vw, 62px)', lineHeight: 1.08, marginBottom: 24, letterSpacing: '-1px' }}>
              Smart Load Board<br />Built for <span style={{ color: '#0ea5e9' }}>Driver Profit.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 17, lineHeight: 1.8, marginBottom: 14, maxWidth: 500 }}>
              UrLoad is the AI-powered platform that tells you exactly which loads to take,
              which brokers to trust, and how to maximize profit on every mile.
            </p>
            <a href="#features" style={{ color: '#0ea5e9', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block', marginBottom: 36 }}>
              Show more »
            </a>
            <div style={{ marginBottom: 28 }}>
              <button
                onClick={onWaitlist}
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                  color: '#fff', fontWeight: 700, fontSize: 16,
                  padding: '15px 40px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
                }}
              >
                Get Started
              </button>
            </div>
            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#fbbf24', fontSize: 22, lineHeight: 1 }}>★</span>)}
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500, marginLeft: 6 }}>400+ five star reviews</span>
            </div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <AppBadge type="google" />
              <AppBadge type="apple" />
            </div>
          </div>

          {/* ── Right: mockup ── */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -24, borderRadius: 32,
              background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <MockLoadBoard />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── FEATURE ROW ────────────────────────────────────────────────────────────────
function FeatureRow({ flip = false, light = false, label, title, desc, bullets, onWaitlist, visual }) {
  const bg     = light ? '#f7f8fa' : '#0d1117';
  const headC  = light ? '#111827' : '#ffffff';
  const bodyC  = light ? '#6b7280' : '#8b949e';
  const bulletC = light ? '#374151' : '#8b949e';
  const learnC = light ? '#111827' : '#e6edf3';

  return (
    <section style={{ background: bg, padding: '100px 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-14 lg:gap-20 items-center`}>
          {/* Text */}
          <div className={flip ? 'lg:order-2' : ''}>
            <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 14 }}>
              {label}
            </span>
            <h2 style={{ color: headC, fontWeight: 800, fontSize: 42, lineHeight: 1.1, marginBottom: 18 }}>
              {title}
            </h2>
            <p style={{ color: bodyC, fontSize: 17, lineHeight: 1.75, marginBottom: 28 }}>
              {desc}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {bullets.map(b => (
                <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} style={{ color: '#0ea5e9' }} />
                  </div>
                  <span style={{ color: bulletC, fontSize: 15 }}>{b}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={onWaitlist} className="btn-primary flex items-center gap-2">
                Get Started <ArrowRight size={16} />
              </button>
              <Link to="/login" style={{ color: learnC, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                See how it works <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className={flip ? 'lg:order-1' : ''}>
            {visual}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── REMAINING FEATURES GRID ────────────────────────────────────────────────────
function MoreFeatures() {
  const features = [
    {
      icon: Zap, title: 'Hot Load Feed', tag: 'Elite', tagColor: 'badge-red',
      desc: 'First access to the best loads before they disappear. Elite members see high-profit loads minutes ahead of the market.',
    },
    {
      icon: TrendingUp, title: 'Rate Intelligence', tag: 'Pro+', tagColor: 'badge-yellow',
      desc: 'See instantly if a load is above or below market rate. Never get lowballed again with live market comparison.',
    },
    {
      icon: BarChart2, title: 'Earnings Analytics', tag: 'Pro+', tagColor: 'badge-yellow',
      desc: 'Weekly profit reports, best lane breakdowns, and monthly earnings trends — all in one clean dashboard.',
    },
  ];

  return (
    <section style={{ background: '#080c10', padding: '100px 0' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge-green text-sm mb-5 inline-block">More Features</span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Everything else you need.<br />
            <span className="gradient-text">Nothing you don't.</span>
          </h2>
          <p className="text-dark-200 text-lg max-w-xl mx-auto">Every feature is designed around one goal: put more money in your pocket per mile.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, tag, tagColor, desc }) => (
            <div key={title} className="glass rounded-2xl p-8 border border-dark-400/40 hover:border-brand-500/20 transition-all hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                  <Icon size={22} className="text-brand-400" />
                </div>
                <span className={tagColor + ' text-xs'}>{tag}</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
              <p className="text-dark-200 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: 'Marcus T.', role: 'Owner-Operator · 5 years', avatar: 'MT', text: "UrLoad's Earnings Brain told me to avoid a broker I'd been using for years. Turned out they had 3 delayed payments that week. Saved me $2,400 in headaches.", stars: 5 },
    { name: 'Jessica R.', role: 'Fleet Owner · 4 trucks', avatar: 'JR', text: 'The profit calculator alone is worth the Pro subscription. I rejected 6 loads last week that looked good on paper but were actually losing money after fuel and deadhead.', stars: 5 },
    { name: 'Derek L.', role: 'OTR Driver · 3 years', avatar: 'DL', text: "Finally a load board that doesn't just show me loads — it shows me which ones will actually make me money. My weekly net is up 34% since switching.", stars: 5 },
    { name: 'Priya S.', role: 'Freight Broker', avatar: 'PS', text: 'As a broker, the Elite plan gave me access to serious, high-volume carriers. My load acceptance rate went from 31% to 67% in 6 weeks.', stars: 5 },
  ];

  return (
    <section style={{ background: '#0d1117', padding: '100px 0' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge-green text-sm mb-5 inline-block">Reviews</span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Drivers trust UrLoad.</h2>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />)}
            <span className="text-white font-bold ml-2">4.9</span>
            <span className="text-dark-300 text-sm ml-1">from 1,284 reviews</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map(({ name, role, avatar, text, stars }) => (
            <div key={name} className="glass rounded-2xl p-6 border border-dark-400/40 hover:border-brand-500/20 transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(stars)].map((_, i) => <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-dark-100 text-sm leading-relaxed mb-5">"{text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">{avatar}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{name}</p>
                  <p className="text-dark-300 text-xs">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ────────────────────────────────────────────────────────────────────
function Pricing({ onWaitlist }) {
  const [tab, setTab] = useState('carrier');

  const plans = {
    carrier: [
      { name: 'Basic', price: 0, period: 'forever', desc: 'Just getting started', color: 'default',
        features: ['20 load views/day', 'Basic profit calculator', 'Standard filters', 'Email support'],
        missing: ['Broker ratings', 'Earnings Brain', 'Hot load alerts', 'Analytics'] },
      { name: 'Pro', price: 49, period: 'month', desc: 'Most popular for owner-operators', color: 'brand', popular: true,
        features: ['Unlimited load views', 'Full profit calculator', 'Broker ratings & reviews', 'Basic Earnings Brain', 'Hot load notifications', '90-day load history', 'Priority support'],
        missing: ['Advanced AI insights', 'Early load access', 'Full analytics'] },
      { name: 'Elite', price: 99, period: 'month', desc: 'Maximum earning power', color: 'purple',
        features: ['Everything in Pro', 'Full Driver Earnings Brain', 'Priority load access', 'Early hot load alerts', 'Advanced analytics', 'Weekly profit reports', 'Dedicated account rep'],
        missing: [] },
    ],
    broker: [
      { name: 'Basic', price: 0, period: 'forever', desc: 'Post and be discovered', color: 'default',
        features: ['10 active postings', 'Standard visibility', 'Basic dashboard'],
        missing: ['Enhanced visibility', 'Carrier analytics', 'Priority placement', 'API access'] },
      { name: 'Pro', price: 79, period: 'month', desc: 'More reach, better conversions', color: 'brand', popular: true,
        features: ['50 active postings', 'Enhanced visibility', 'Carrier engagement data', 'Performance dashboard', 'Priority support'],
        missing: ['Priority placement', 'API access', 'Unlimited postings'] },
      { name: 'Elite', price: 149, period: 'month', desc: 'Dominate the board', color: 'purple',
        features: ['Unlimited postings', 'Priority placement', 'Full conversion analytics', 'Premium carrier exposure', 'Dedicated account rep', 'API access'],
        missing: [] },
    ],
  };

  const colorMap = {
    default: { border: 'border-dark-400/40', btn: 'btn-secondary', badge: '' },
    brand:   { border: 'border-brand-500/40', btn: 'btn-primary glow-green', badge: 'badge-green' },
    purple:  { border: 'border-purple-500/40', btn: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all', badge: 'badge-blue' },
  };

  return (
    <section id="pricing" style={{ background: '#080c10', padding: '100px 0' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(14,165,233,0.04) 0%, transparent 60%)' }} />
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-14">
          <span className="badge-green text-sm mb-5 inline-block">Pricing</span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Simple, transparent pricing.<br /><span className="gradient-text">No hidden fees.</span>
          </h2>
          <p className="text-dark-200 text-lg">Start free. Upgrade when you're ready to maximize earnings.</p>
          <div className="inline-flex glass rounded-xl p-1 mt-8">
            {['carrier', 'broker'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-brand-500 text-white' : 'text-dark-200 hover:text-white'}`}>
                {t === 'carrier' ? '🚛 Carriers' : '📋 Brokers'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans[tab].map((plan) => {
            const c = colorMap[plan.color];
            return (
              <div key={plan.name} className={`glass rounded-2xl p-7 border ${c.border} relative flex flex-col ${plan.popular ? 'scale-105 shadow-2xl shadow-brand-500/10' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="badge-green text-xs px-3 py-1">Most Popular</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-dark-300 text-sm">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <p className="text-4xl font-black text-white">Free</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-dark-300 text-lg">$</span>
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-dark-300 text-sm mb-1">/{plan.period}</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-100">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-35">
                      <X size={14} className="text-dark-400 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-300 line-through">{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onWaitlist} className={`block text-center w-full py-3 rounded-lg font-semibold transition-all text-sm ${c.btn}`}>
                  Join Waitlist
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-center text-dark-300 text-sm mt-10">All plans include 14-day free trial on paid tiers. No credit card required.</p>
      </div>
    </section>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────────
function CTA({ onWaitlist }) {
  return (
    <section style={{ background: '#0d1117', padding: '100px 0' }}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="glass rounded-3xl border border-brand-500/15 p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.07) 0%, transparent 70%)' }} />
          <div className="relative">
            <span className="badge-green text-sm mb-6 inline-block">Start Today</span>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-5">Ready to earn smarter?</h2>
            <p className="text-dark-200 text-lg mb-10 max-w-xl mx-auto">
              Join 2,100+ drivers already using UrLoad to maximize their earnings per mile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={onWaitlist} className="btn-primary text-base px-10 py-4 flex items-center justify-center gap-2 glow-green">
                Join the Waitlist <ArrowRight size={18} />
              </button>
              <Link to="/login" className="btn-secondary text-base px-10 py-4 flex items-center justify-center gap-2">
                View Live Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#080c10', borderTop: '1px solid rgba(48,54,61,0.4)', padding: '60px 0 32px' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <img src="/urload-logo.png" alt="UrLoad" style={{ height: 28, width: 'auto' }} />
            </div>
            <p className="text-dark-300 text-sm leading-relaxed">The driver profit optimization platform. Built by truckers, for truckers.</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Compare', 'Changelog'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Contact'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-3">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                {links.map(l => <li key={l}><a href="#" className="text-dark-300 hover:text-white text-sm transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-dark-400/40">
          <p className="text-dark-400 text-sm">© 2026 UrLoad, Inc. All rights reserved.</p>
          <p className="text-dark-400 text-sm mt-2 sm:mt-0">Built for the road. ⚡</p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────────
export default function Landing() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const open = () => setShowWaitlist(true);

  return (
    <div style={{ background: '#080c10', minHeight: '100vh' }}>
      <Navbar />
      <Hero onWaitlist={open} />
      <WaveTransition />

      <FeatureRow
        light
        label="Profit Calculator"
        title={<>Know your profit<br />before you commit.</>}
        desc="Every load is color-coded green, yellow, or red. Fuel, deadhead, and net profit — all calculated in seconds before you ever call back."
        bullets={[
          'Fuel cost estimator built in',
          'Deadhead miles penalty included',
          'Real-time net profit display',
          'Color-coded score: green / yellow / red',
        ]}
        visual={<MockCalculator />}
        onWaitlist={open}
      />

      <FeatureRow
        flip
        label="Earnings Brain"
        title={<>AI that learns your lanes<br />and works while you drive.</>}
        desc="Our Driver Earnings Brain analyzes your history, spots patterns, and tells you when to haul, when to wait, and which brokers to ghost."
        bullets={[
          'Lane profit pattern analysis',
          'Broker performance history',
          'Market rate alerts in real time',
          'Weekly earnings recommendations',
        ]}
        visual={<MockBrain />}
        onWaitlist={open}
      />

      <FeatureRow
        light
        label="Broker Trust System"
        title={<>Know who pays fast<br />and who ghosts you.</>}
        desc="Verified ratings, payment speed data, and community red flags on every broker on the board. Never get burned by a slow-pay broker again."
        bullets={[
          'Payment speed ratings per broker',
          'Community-verified reviews',
          'Red flag warnings before you call',
          'Dispute and non-payment history',
        ]}
        visual={<MockBrokers />}
        onWaitlist={open}
      />

      <MoreFeatures />
      <Testimonials />
      <Pricing onWaitlist={open} />
      <CTA onWaitlist={open} />
      <Footer />
      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </div>
  );
}
