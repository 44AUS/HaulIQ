import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Brain, Calculator, Star, TrendingUp, Shield, Zap, ArrowRight,
  Check, X, ChevronRight, BarChart2, Users, Flame,
  AlertTriangle
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

// ─── TRUCK MAP ANIMATION ────────────────────────────────────────────────────────
function TruckMap() {
  const routes = [
    // I-90: Seattle → Minneapolis → Chicago → Detroit → Boston
    { id: 'r1', d: 'M 108,108 C 240,98 368,108 456,116 C 512,122 536,172 600,184 C 665,192 728,166 786,156' },
    // I-80: SF → Salt Lake → Denver → Chicago
    { id: 'r2', d: 'M 84,278 C 155,268 222,244 296,246 C 388,246 462,216 536,190' },
    // I-40: LA → Albuquerque → Memphis → Charlotte
    { id: 'r3', d: 'M 114,368 C 196,354 272,338 312,362 C 396,376 468,354 546,332 C 598,314 652,296 700,293' },
    // I-10: LA → Houston → New Orleans → Jacksonville
    { id: 'r4', d: 'M 114,372 C 198,362 280,378 312,378 C 400,378 464,412 526,414 C 572,414 622,398 666,388' },
    // I-75: Detroit → Atlanta → Miami
    { id: 'r5', d: 'M 600,182 C 598,215 592,244 588,248 C 582,272 562,302 556,334 C 578,344 645,344 646,346 C 654,372 664,388 666,390 C 674,414 684,440 690,460' },
    // I-35: Minneapolis → Kansas City → Dallas
    { id: 'r6', d: 'M 456,114 C 462,166 464,212 464,252 C 464,304 456,344 446,370' },
    // I-95: Boston → NYC → Charlotte → Miami
    { id: 'r7', d: 'M 786,154 C 770,170 754,188 750,200 C 742,218 734,236 722,256 C 710,274 702,293 700,295 C 686,326 672,360 666,390 C 672,416 682,440 690,460' },
    // I-70: Denver → Kansas City → St Louis
    { id: 'r8', d: 'M 296,246 C 362,246 430,254 478,268 C 510,270 538,270 562,268' },
    // I-20: Dallas → Atlanta
    { id: 'r9', d: 'M 446,370 C 498,374 548,364 590,350 C 618,342 638,344 646,344' },
  ];

  const cities = [
    { x: 108, y: 108, label: 'Seattle' },
    { x: 84, y: 278, label: 'San Francisco' },
    { x: 114, y: 370, label: 'Los Angeles' },
    { x: 456, y: 114, label: 'Minneapolis' },
    { x: 536, y: 190, label: 'Chicago' },
    { x: 600, y: 182, label: 'Detroit' },
    { x: 786, y: 154, label: 'Boston' },
    { x: 750, y: 200, label: 'New York' },
    { x: 700, y: 293, label: 'Charlotte' },
    { x: 446, y: 370, label: 'Dallas' },
    { x: 464, y: 412, label: 'Houston' },
    { x: 646, y: 344, label: 'Atlanta' },
    { x: 690, y: 460, label: 'Miami' },
    { x: 296, y: 246, label: 'Denver' },
    { x: 562, y: 268, label: 'St. Louis' },
  ];

  const trucks = routes.flatMap((r, i) => [
    { rid: r.id, dur: `${10 + i * 1.4}s`, begin: `${i * 1.1}s`, rev: false },
    { rid: r.id, dur: `${13 + i * 1.1}s`, begin: `${4 + i * 0.9}s`, rev: true },
  ]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 900 520" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="cglow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="tglow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Route glow halos */}
        {routes.map(r => (
          <path key={`halo-${r.id}`} d={r.d} fill="none"
            stroke="#22c55e" strokeWidth="6" strokeOpacity="0.04" strokeLinecap="round"/>
        ))}

        {/* Route path definitions (referenced by mpath) */}
        {routes.map(r => (
          <path key={r.id} id={r.id} d={r.d} fill="none"
            stroke="#22c55e" strokeWidth="0.8" strokeOpacity="0.28"
            strokeDasharray="6 10" strokeLinecap="round"/>
        ))}

        {/* Trucks */}
        {trucks.map((t, i) => (
          <g key={i} filter="url(#tglow)">
            {/* Trailer */}
            <rect x="-10" y="-2.8" width="10" height="5.6" rx="0.6" fill="#14532d" opacity="0.95"/>
            <line x1="-9" y1="-2.8" x2="-9" y2="2.8" stroke="#22c55e" strokeWidth="0.3" opacity="0.4"/>
            <line x1="-6" y1="-2.8" x2="-6" y2="2.8" stroke="#22c55e" strokeWidth="0.3" opacity="0.3"/>
            <line x1="-3" y1="-2.8" x2="-3" y2="2.8" stroke="#22c55e" strokeWidth="0.3" opacity="0.3"/>
            {/* Cab */}
            <rect x="0" y="-3.8" width="6" height="7.6" rx="1.2" fill="#166534" opacity="0.95"/>
            {/* Windshield */}
            <rect x="0.8" y="-2.8" width="3.2" height="2.8" rx="0.4" fill="#4ade80" opacity="0.5"/>
            {/* Headlight */}
            <circle cx="6" cy="-0.6" r="0.9" fill="#fef08a" opacity="0.95"/>
            <circle cx="6" cy="0.6" r="0.6" fill="#fde68a" opacity="0.7"/>
            {/* Light beam */}
            <line x1="6.5" y1="-0.6" x2="18" y2="-2" stroke="#fef08a" strokeWidth="0.4" opacity="0.25"/>
            <line x1="6.5" y1="0.5" x2="18" y2="1.5" stroke="#fef08a" strokeWidth="0.3" opacity="0.15"/>
            {/* Wheels */}
            <circle cx="-7" cy="2.8" r="1.6" fill="#0f172a" stroke="#22c55e" strokeWidth="0.4"/>
            <circle cx="-2" cy="2.8" r="1.6" fill="#0f172a" stroke="#22c55e" strokeWidth="0.4"/>
            <circle cx="3.5" cy="3.8" r="1.6" fill="#0f172a" stroke="#166534" strokeWidth="0.4"/>
            <animateMotion dur={t.dur} repeatCount="indefinite" begin={t.begin}
              rotate="auto"
              keyPoints={t.rev ? '1;0' : '0;1'}
              keyTimes="0;1" calcMode="linear">
              <mpath href={`#${t.rid}`}/>
            </animateMotion>
          </g>
        ))}

        {/* City dots */}
        {cities.map((c, i) => (
          <g key={c.label}>
            {/* Outer pulse */}
            <circle cx={c.x} cy={c.y} r="3" fill="none" stroke="#22c55e" strokeWidth="0.5">
              <animate attributeName="r" values="3;10;3"
                dur={`${2.8 + (i % 4) * 0.6}s`} repeatCount="indefinite" begin={`${i * 0.25}s`}/>
              <animate attributeName="opacity" values="0.5;0;0.5"
                dur={`${2.8 + (i % 4) * 0.6}s`} repeatCount="indefinite" begin={`${i * 0.25}s`}/>
            </circle>
            {/* Core dot */}
            <circle cx={c.x} cy={c.y} r="2.2" fill="#22c55e" opacity="0.85" filter="url(#cglow)"/>
            {/* City label */}
            <text x={c.x + 4} y={c.y - 4} fill="#4ade80" fontSize="6" opacity="0.55"
              fontFamily="monospace" letterSpacing="0.3">{c.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Dark base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-800" />

      {/* Animated truck map */}
      <TruckMap />

      {/* Radial green glow over map */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,rgba(34,197,94,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* Top vignette so text stays crisp */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-dark-900 via-dark-900/80 to-transparent pointer-events-none" />
      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 badge-green mb-8 text-sm px-4 py-1.5 animate-fade-in">
          <Flame size={14} className="text-brand-400" />
          <span>The Load Board Built for Driver Profit</span>
          <ChevronRight size={14} />
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 animate-slide-up">
          Stop Hauling.<br />
          Start <span className="gradient-text">Earning Smarter.</span>
        </h1>

        <p className="text-xl text-dark-100 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
          HaulIQ replaces the old load board with an AI-powered profit engine that tells you exactly which loads to take, which brokers to avoid, and when to wait for better rates.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
          <Link to="/signup" className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 glow-green">
            Start for Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2">
            View Live Demo
          </Link>
        </div>

        {/* Social proof */}
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
function Pricing() {
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

          {/* Tab */}
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
                <Link to="/signup" className={`block text-center w-full py-3 rounded-lg font-semibold transition-all text-sm ${c.btn}`}>
                  {plan.price === 0 ? 'Get Started Free' : `Start ${plan.name}`}
                </Link>
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
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            HaulIQ vs. The Old Guard
          </h2>
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
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
                  {avatar}
                </div>
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
function ViralFeature() {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="glass rounded-2xl border border-brand-500/20 p-8 lg:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.06)_0%,transparent_70%)]" />
          <div className="relative">
            <span className="badge-green text-sm mb-5 inline-block">🔥 Viral Feature</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              The "Worst Loads of the Day" Feed
            </h2>
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
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-8 py-3 glow-green">
              See Today's Worst Loads <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)]" />
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
              Ready to earn smarter?
            </h2>
            <p className="text-dark-200 text-lg mb-10 max-w-xl mx-auto">
              Join 2,100+ drivers already using HaulIQ to maximize their earnings per mile. Start free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup?role=carrier" className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 glow-green">
                I'm a Driver <ArrowRight size={18} />
              </Link>
              <Link to="/signup?role=broker" className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-2">
                I'm a Broker <ArrowRight size={18} />
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
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Comparison />
      <Testimonials />
      <ViralFeature />
      <CTA />
      <Footer />
    </div>
  );
}
