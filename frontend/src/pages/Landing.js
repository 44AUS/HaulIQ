import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Brain, Calculator, Star, TrendingUp, Shield, Zap, ArrowRight,
  Check, X, ChevronRight, BarChart2, Users, Flame,
  AlertTriangle, Mail, User
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { waitlistApi } from '../services/api';

// ─── WAITLIST MODAL ────────────────────────────────────────────────────────────
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
              <p className="text-dark-300 text-sm">Get early access to HaulIQ and be first in line when we launch.</p>
            </div>

            {/* Role toggle */}
            <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-dark-400/40 mb-6">
              {[
                { key: 'carrier', label: '🚛 I\'m a Carrier' },
                { key: 'broker',  label: '📋 I\'m a Broker' },
              ].map(opt => (
                <button key={opt.key} type="button" onClick={() => setRole(opt.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    role === opt.key ? 'bg-brand-500 text-white' : 'text-dark-300 hover:text-white'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-1.5">Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9" placeholder="Your name" value={name}
                    onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-1.5">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input className="input pl-9" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} required />
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

// ─── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ onWaitlist }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-800" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#22c55e 1px,transparent 1px),linear-gradient(90deg,#22c55e 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(34,197,94,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Edge vignettes */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dark-900 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 badge-green mb-8 text-sm px-4 py-1.5 animate-fade-in">
          <Flame size={14} className="text-brand-400" />
          <span>The Load Board Built for Driver Profit</span>
          <ChevronRight size={14} />
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 animate-slide-up">
          Stop Hauling.<br />
          Start <span className="gradient-text">Earning Smarter.</span>
        </h1>

        <p className="text-xl text-dark-100 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
          HaulIQ replaces the old load board with an AI-powered profit engine that tells you exactly which loads to take, which brokers to avoid, and when to wait for better rates.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
          <button onClick={onWaitlist} className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 glow-green">
            Join the Waitlist <ArrowRight size={18} />
          </button>
          <Link to="/login" className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2">
            View Live Demo
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-dark-200 mb-8">
          {[['2,100+', 'Active Drivers'], ['$48K+', 'Monthly Savings'], ['4.9★', 'App Rating'], ['No CC', 'Required']].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="text-white font-bold text-lg">{val}</p>
              <p className="text-dark-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Brain, title: 'Driver Earnings Brain',
      desc: 'AI that learns your routes, spots patterns, and tells you when to haul, when to wait, and which brokers to ghost.',
      tag: 'AI-Powered', tagColor: 'badge-blue',
      bullets: ['Lane profit patterns', 'Broker performance history', 'Market rate alerts'],
    },
    {
      icon: Calculator, title: 'Profit Calculator',
      desc: 'Every load is color-coded green, yellow, or red before you commit. Fuel, deadhead, and net profit — calculated in seconds.',
      tag: 'Core Feature', tagColor: 'badge-green',
      bullets: ['Fuel cost estimator', 'Deadhead penalty', 'Real-time net profit'],
    },
    {
      icon: Shield, title: 'Broker Trust System',
      desc: 'Know who pays fast and who ghosts you. Verified ratings, payment speed data, and community red flags.',
      tag: 'Driver-First', tagColor: 'badge-green',
      bullets: ['Payment speed ratings', 'Community reviews', 'Warning flags'],
    },
    {
      icon: Zap, title: 'Hot Load Feed',
      desc: 'First access to the best loads before they disappear. Elite members see high-profit loads minutes ahead of the market.',
      tag: 'Elite', tagColor: 'badge-red',
      bullets: ['Real-time notifications', 'Priority access', 'Profitability filter'],
    },
    {
      icon: TrendingUp, title: 'Rate Intelligence',
      desc: 'See instantly if a load is above or below market rate. Never get lowballed again with live market comparison.',
      tag: 'Pro+', tagColor: 'badge-yellow',
      bullets: ['Market rate vs posted', 'Underpriced load alerts', 'Trend analysis'],
    },
    {
      icon: BarChart2, title: 'Earnings Analytics',
      desc: 'Weekly profit reports, best lane breakdowns, and monthly earnings trends — all in one clean dashboard.',
      tag: 'Pro+', tagColor: 'badge-yellow',
      bullets: ['Weekly profit reports', 'Lane rankings', 'Broker history'],
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge-green text-sm mb-4 inline-block">Features</span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Everything a driver needs.<br /><span className="gradient-text">Nothing they don't.</span></h2>
          <p className="text-dark-200 text-lg max-w-xl mx-auto">Every feature is designed around one goal: put more money in your pocket per mile driven.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, tag, tagColor, bullets }) => (
            <div key={title} className="glass rounded-xl p-6 border border-dark-400/40 hover:border-brand-500/20 transition-all duration-200 hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <span className={tagColor + ' text-xs'}>{tag}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
              <p className="text-dark-200 text-sm leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {bullets.map(b => (
                  <li key={b} className="flex items-center gap-2 text-dark-100 text-xs">
                    <Check size={12} className="text-brand-400 flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
function Pricing({ onWaitlist }) {
  const [tab, setTab] = useState('carrier');

  const plans = {
    carrier: [
      { name: 'Basic', price: 0, period: 'forever', desc: 'Just getting started', color: 'default',
        features: ['20 load views/day', 'Basic profit calculator', 'Standard filters', 'Email support'],
        missing: ['Broker ratings', 'Earnings Brain', 'Hot load alerts', 'Analytics'],
      },
      { name: 'Pro', price: 49, period: 'month', desc: 'Most popular for owner-operators', color: 'brand', popular: true,
        features: ['Unlimited load views', 'Full profit calculator', 'Broker ratings & reviews', 'Basic Earnings Brain', 'Hot load notifications', '90-day load history', 'Priority support'],
        missing: ['Advanced AI insights', 'Early load access', 'Full analytics'],
      },
      { name: 'Elite', price: 99, period: 'month', desc: 'Maximum earning power', color: 'purple',
        features: ['Everything in Pro', 'Full Driver Earnings Brain', 'Priority load access', 'Early hot load alerts', 'Advanced analytics', 'Weekly profit reports', 'Dedicated account rep'],
        missing: [],
      },
    ],
    broker: [
      { name: 'Basic', price: 0, period: 'forever', desc: 'Post and be discovered', color: 'default',
        features: ['10 active postings', 'Standard visibility', 'Basic dashboard'],
        missing: ['Enhanced visibility', 'Carrier analytics', 'Priority placement', 'API access'],
      },
      { name: 'Pro', price: 79, period: 'month', desc: 'More reach, better conversions', color: 'brand', popular: true,
        features: ['50 active postings', 'Enhanced visibility', 'Carrier engagement data', 'Performance dashboard', 'Priority support'],
        missing: ['Priority placement', 'API access', 'Unlimited postings'],
      },
      { name: 'Elite', price: 149, period: 'month', desc: 'Dominate the board', color: 'purple',
        features: ['Unlimited postings', 'Priority placement', 'Full conversion analytics', 'Premium carrier exposure', 'Dedicated account rep', 'API access'],
        missing: [],
      },
    ],
  };

  const colorMap = {
    default: { border: 'border-dark-400/40', btn: 'btn-secondary', badge: '' },
    brand:   { border: 'border-brand-500/40', btn: 'btn-primary glow-green', badge: 'badge-green' },
    purple:  { border: 'border-purple-500/40', btn: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all', badge: 'badge-blue' },
  };

  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05)_0%,transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-12">
          <span className="badge-green text-sm mb-4 inline-block">Pricing</span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Simple, transparent pricing.<br /><span className="gradient-text">No hidden fees.</span></h2>
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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
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
                    <li key={f} className="flex items-start gap-2 text-sm opacity-40">
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
        <p className="text-center text-dark-300 text-sm mt-8">All plans include 14-day free trial on paid tiers. No credit card required.</p>
      </div>
    </section>
  );
}

// ─── COMPARISON TABLE ─────────────────────────────────────────────────────────
function Comparison() {
  const rows = [
    { feature: 'Real-time profit calculator',      hauliq: true,  dat: false, truckstop: false },
    { feature: 'AI-powered lane insights',          hauliq: true,  dat: false, truckstop: false },
    { feature: 'Broker payment speed ratings',      hauliq: true,  dat: true,  truckstop: true  },
    { feature: 'Color-coded profitability score',   hauliq: true,  dat: false, truckstop: false },
    { feature: 'Deadhead cost calculator',          hauliq: true,  dat: false, truckstop: false },
    { feature: 'Hot load early access',             hauliq: true,  dat: false, truckstop: false },
    { feature: '"Worst loads" warning feed',        hauliq: true,  dat: false, truckstop: false },
    { feature: 'Driver earnings brain (AI)',        hauliq: true,  dat: false, truckstop: false },
    { feature: 'Weekly profit reports',             hauliq: true,  dat: false, truckstop: false },
    { feature: 'Anonymous driver insights',         hauliq: true,  dat: false, truckstop: false },
    { feature: 'Modern, mobile-first UI',           hauliq: true,  dat: false, truckstop: false },
    { feature: 'Free starter plan',                 hauliq: true,  dat: false, truckstop: false },
    { feature: 'Starts at',                         hauliq: '$0/mo', dat: '$45/mo', truckstop: '$39/mo' },
  ];

  return (
    <section id="compare" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="badge-green text-sm mb-4 inline-block">Comparison</span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">HaulIQ vs. The Old Guard</h2>
          <p className="text-dark-200 text-lg">DAT and Truckstop were built in the 90s. We built HaulIQ for 2026.</p>
        </div>

        <div className="glass rounded-2xl border border-dark-400/40 overflow-hidden">
          <div className="grid grid-cols-4 bg-dark-700/60 border-b border-dark-400/40">
            <div className="p-4 text-dark-300 text-sm font-medium">Feature</div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Truck size={16} className="text-brand-400" />
                <span className="text-brand-400 font-bold text-sm">HaulIQ</span>
              </div>
            </div>
            <div className="p-4 text-center text-dark-300 text-sm font-medium">DAT</div>
            <div className="p-4 text-center text-dark-300 text-sm font-medium">Truckstop</div>
          </div>
          {rows.map(({ feature, hauliq, dat, truckstop }, i) => (
            <div key={feature} className={`grid grid-cols-4 border-b border-dark-400/20 ${i % 2 === 0 ? 'bg-dark-800/30' : ''} hover:bg-dark-700/20 transition-colors`}>
              <div className="p-4 text-dark-100 text-sm">{feature}</div>
              {[['hauliq', hauliq], ['dat', dat], ['truckstop', truckstop]].map(([key, val]) => (
                <div key={key} className={`p-4 flex justify-center items-center ${key === 'hauliq' ? 'bg-brand-500/3' : ''}`}>
                  {typeof val === 'boolean' ? (
                    val ? <Check size={18} className={key === 'hauliq' ? 'text-brand-400' : 'text-dark-500'} />
                        : <X size={18} className="text-dark-600" />
                  ) : (
                    <span className={`text-sm font-semibold ${key === 'hauliq' ? 'text-brand-400' : 'text-dark-400'}`}>{val}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: 'Marcus T.', role: 'Owner-Operator · 5 years', avatar: 'MT', text: 'HaulIQ\'s Earnings Brain told me to avoid a broker I\'d been using for years. Turned out they had 3 delayed payments that week. Saved me $2,400 in headaches.', stars: 5 },
    { name: 'Jessica R.', role: 'Fleet Owner · 4 trucks', avatar: 'JR', text: 'The profit calculator alone is worth the Pro subscription. I rejected 6 loads last week that looked good on paper but were actually losing money after fuel and deadhead.', stars: 5 },
    { name: 'Derek L.', role: 'OTR Driver · 3 years', avatar: 'DL', text: 'Finally a load board that doesn\'t just show me loads — it shows me which ones will actually make me money. My weekly net is up 34% since switching.', stars: 5 },
    { name: 'Priya S.', role: 'Freight Broker', avatar: 'PS', text: 'As a broker, the Elite plan gave me access to serious, high-volume carriers. My load acceptance rate went from 31% to 67% in 6 weeks.', stars: 5 },
  ];

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="badge-green text-sm mb-4 inline-block">Reviews</span>
          <h2 className="text-4xl font-black text-white mb-4">Drivers trust HaulIQ.</h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />)}
            <span className="text-white font-bold ml-2">4.9</span>
            <span className="text-dark-300 text-sm ml-1">from 1,284 reviews</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map(({ name, role, avatar, text, stars }) => (
            <div key={name} className="glass rounded-xl p-5 border border-dark-400/40 hover:border-brand-500/20 transition-all">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(stars)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-dark-100 text-sm leading-relaxed mb-4">"{text}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">{avatar}</div>
                <div>
                  <p className="text-white text-sm font-medium">{name}</p>
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

// ─── VIRAL FEATURE ─────────────────────────────────────────────────────────────
function ViralFeature({ onWaitlist }) {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="glass rounded-2xl border border-brand-500/20 p-8 lg:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.06)_0%,transparent_70%)]" />
          <div className="relative">
            <span className="badge-green text-sm mb-5 inline-block">🔥 Viral Feature</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">The "Worst Loads of the Day" Feed</h2>
            <p className="text-dark-200 text-lg mb-6 max-w-2xl mx-auto">
              Every day, HaulIQ publishes the 10 worst loads on the market — embarrassingly low rates, sketchy brokers, and money-losing miles. Share it. Laugh about it. Never take one.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: AlertTriangle, label: 'Exposes bad actors', color: 'text-red-400' },
                { icon: Users, label: 'Drivers share it daily', color: 'text-brand-400' },
                { icon: TrendingUp, label: 'Viral growth loop', color: 'text-blue-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="glass-light rounded-lg p-4">
                  <Icon size={20} className={`${color} mx-auto mb-2`} />
                  <p className="text-white text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
            <button onClick={onWaitlist} className="btn-primary inline-flex items-center gap-2 px-8 py-3 glow-green">
              Join the Waitlist <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA({ onWaitlist }) {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)]" />
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Ready to earn smarter?</h2>
            <p className="text-dark-200 text-lg mb-10 max-w-xl mx-auto">
              Join 2,100+ drivers already using HaulIQ to maximize their earnings per mile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={onWaitlist} className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 glow-green">
                Join the Waitlist <ArrowRight size={18} />
              </button>
              <Link to="/login" className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2">
                View Live Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-dark-400/40 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Truck size={15} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">Haul<span className="gradient-text">IQ</span></span>
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
              <ul className="space-y-2.5">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                {links.map(l => <li key={l}><a href="#" className="text-dark-300 hover:text-white text-sm transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-dark-400/40">
          <p className="text-dark-400 text-sm">© 2026 HaulIQ, Inc. All rights reserved.</p>
          <p className="text-dark-400 text-sm mt-2 sm:mt-0">Built for the road. ⚡</p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function Landing() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navbar />
      <Hero onWaitlist={() => setShowWaitlist(true)} />
      <Features />
      <Pricing onWaitlist={() => setShowWaitlist(true)} />
      <Comparison />
      <Testimonials />
      <ViralFeature onWaitlist={() => setShowWaitlist(true)} />
      <CTA onWaitlist={() => setShowWaitlist(true)} />
      <Footer />
      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </div>
  );
}
