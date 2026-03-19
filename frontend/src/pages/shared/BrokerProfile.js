import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Shield, AlertTriangle, Zap, ThumbsUp, ThumbsDown, Clock, CheckCircle, ArrowLeft, MessageSquare, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BROKERS, SAMPLE_BROKER_REVIEWS } from '../../data/sampleData';

// Star rating input component
function StarInput({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110">
          <Star size={size}
            className={(hover || value) >= i ? 'text-yellow-400 fill-yellow-400' : 'text-dark-500'} />
        </button>
      ))}
    </div>
  );
}

// Sub-rating row
function SubRating({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-dark-400 text-xs w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`w-4 h-1.5 rounded-full ${i <= value ? 'bg-brand-500' : 'bg-dark-600'}`} />
        ))}
      </div>
      <span className="text-dark-300 text-xs">{value}/5</span>
    </div>
  );
}

// Logo circle — shows image if available, falls back to initials
function BrokerLogoCircle({ logo, name, size = 'lg', isOwner = false, onUpload }) {
  const ref = useRef();
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-8 h-8 text-xs';

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className={`relative flex-shrink-0 ${dim} rounded-full`}>
      {logo
        ? <img src={logo} alt={name} className={`${dim} rounded-full object-cover border-2 border-dark-400/40`} />
        : <div className={`${dim} rounded-full bg-brand-500/10 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 font-black`}>{initials}</div>
      }
      {isOwner && (
        <>
          <button onClick={() => ref.current.click()}
            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            title="Upload logo">
            <Camera size={size === 'lg' ? 18 : 12} className="text-white" />
          </button>
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}

export default function BrokerProfile() {
  const { brokerId } = useParams();
  const { user, updateUser } = useAuth();

  const broker = BROKERS.find(b => b.id === brokerId);
  const reviews = SAMPLE_BROKER_REVIEWS[brokerId] || [];

  const isOwner = user?.id === brokerId;
  // For own profile: live logo from user context; for others: broker's stored logo
  const logo = isOwner ? (user?.logo ?? broker?.logo) : broker?.logo;
  const handleLogoUpload = (dataUrl) => updateUser({ logo: dataUrl });

  const [tab, setTab] = useState('reviews');
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Review form state
  const [form, setForm] = useState({
    rating: 0, communication: 0, accuracy: 0,
    paymentDays: '', wouldWorkAgain: null, comment: '', isAnonymous: false,
  });

  if (!broker) return (
    <div className="text-center py-20">
      <p className="text-dark-300">Broker not found.</p>
      <Link to="/carrier/loads" className="text-brand-400 mt-2 inline-block">Back to Load Board</Link>
    </div>
  );

  const allPaymentDays = reviews.filter(r => r.paymentDays).map(r => r.paymentDays);
  const avgPaymentDays = allPaymentDays.length
    ? Math.round(allPaymentDays.reduce((a, b) => a + b, 0) / allPaymentDays.length)
    : null;
  const paySpeedVerified = allPaymentDays.length >= 3;

  const BADGE_MAP = {
    elite:    { label: 'Elite Partner', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   Icon: Zap },
    trusted:  { label: 'Trusted',       cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20', Icon: Shield },
    verified: { label: 'Verified',       cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20', Icon: Shield },
    warning:  { label: 'Warning',       cls: 'bg-red-500/10 text-red-400 border-red-500/20',      Icon: AlertTriangle },
  };
  const badge = BADGE_MAP[broker.badge];

  const handleSubmitReview = () => {
    if (form.rating === 0) return;
    // In real app: POST to /api/brokers/:id/reviews
    setSubmitted(true);
    setShowForm(false);
  };

  // Stats calculations
  const avgComm = reviews.filter(r=>r.communication).length
    ? (reviews.reduce((a,r)=>a+(r.communication||0),0)/reviews.filter(r=>r.communication).length).toFixed(1)
    : null;
  const avgAcc = reviews.filter(r=>r.accuracy).length
    ? (reviews.reduce((a,r)=>a+(r.accuracy||0),0)/reviews.filter(r=>r.accuracy).length).toFixed(1)
    : null;
  const wwaCount = reviews.filter(r=>r.wouldWorkAgain===true).length;
  const wwaPct = reviews.length ? Math.round(wwaCount/reviews.length*100) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link to={-1} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Hero */}
      <div className="glass rounded-xl border border-dark-400/40 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <BrokerLogoCircle
              logo={logo}
              name={broker.name}
              size="lg"
              isOwner={isOwner}
              onUpload={handleLogoUpload}
            />
            <div>
            {isOwner && !logo && (
              <p className="text-dark-500 text-xs mb-1.5 flex items-center gap-1"><Camera size={10} /> Click the circle to upload your company logo</p>
            )}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{broker.name}</h1>
              {badge && (
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-medium ${badge.cls}`}>
                  <badge.Icon size={11} />{badge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} className={i <= Math.round(broker.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'} />
                ))}
              </div>
              <span className="text-white font-bold">{broker.rating}</span>
              <span className="text-dark-400 text-sm">({reviews.length} reviews)</span>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-dark-400 text-xs">Avg Rate/Mile</p>
                <p className="text-white font-semibold">${broker.avgRate}/mi</p>
              </div>
              {broker.warns > 0 && (
                <div>
                  <p className="text-dark-400 text-xs">Warning Flags</p>
                  <p className="text-red-400 font-semibold">{broker.warns} active</p>
                </div>
              )}
            </div>
            </div>{/* end text column */}
          </div>{/* end logo + text row */}
          {user?.role === 'carrier' && !submitted && (
            <button onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
              <Star size={14} /> Write a Review
            </button>
          )}
          {submitted && (
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2">
              <CheckCircle size={14} className="text-brand-400" />
              <span className="text-brand-400 text-sm">Review submitted</span>
            </div>
          )}
        </div>
      </div>

      {/* Pay Speed Verification Panel */}
      <div className={`rounded-xl border p-5 ${paySpeedVerified ? 'bg-brand-500/5 border-brand-500/20' : 'glass border-dark-400/40'}`}>
        <div className="flex items-start gap-3">
          <Clock size={18} className={paySpeedVerified ? 'text-brand-400' : 'text-dark-400'} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-white font-semibold text-sm">Pay Speed</p>
              {paySpeedVerified
                ? <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs px-2 py-0.5 rounded-full">✓ Carrier-Verified</span>
                : <span className="bg-dark-700 text-dark-400 text-xs px-2 py-0.5 rounded-full">Self-Reported</span>
              }
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Broker self-reported</p>
                <p className={`font-bold ${broker.paySpeed === 'Quick-Pay' ? 'text-brand-400' : 'text-white'}`}>{broker.paySpeed}</p>
              </div>
              {avgPaymentDays && (
                <div>
                  <p className="text-dark-400 text-xs mb-0.5">Carrier-reported avg ({allPaymentDays.length} reports)</p>
                  <p className={`font-bold ${avgPaymentDays <= 21 ? 'text-brand-400' : avgPaymentDays <= 35 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {avgPaymentDays} days avg
                  </p>
                </div>
              )}
            </div>
            <p className="text-dark-500 text-xs mt-3 leading-relaxed">
              {paySpeedVerified
                ? `Pay speed is calculated from ${allPaymentDays.length} carriers who reported their actual payment time after completing loads with this broker.`
                : 'Pay speed is self-declared by the broker. It will be verified once 3+ carriers report their actual payment time in reviews.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="glass rounded-xl border border-brand-500/20 p-6">
          <h3 className="text-white font-bold mb-5">Your Review of {broker.name}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-2">Overall Rating *</label>
              <StarInput value={form.rating} onChange={v => setForm(f=>({...f, rating:v}))} size={28} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-2">Communication</label>
                <StarInput value={form.communication} onChange={v => setForm(f=>({...f, communication:v}))} size={20} />
              </div>
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-2">Load Accuracy</label>
                <StarInput value={form.accuracy} onChange={v => setForm(f=>({...f, accuracy:v}))} size={20} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-1.5">Actual payment received in (days)</label>
                <input className="input" type="number" min="1" max="180"
                  placeholder="e.g. 21"
                  value={form.paymentDays}
                  onChange={e => setForm(f=>({...f, paymentDays: e.target.value}))} />
                <p className="text-dark-500 text-xs mt-1">Helps verify pay speed for other drivers</p>
              </div>
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-2">Would you work with them again?</label>
                <div className="flex gap-3">
                  <button onClick={() => setForm(f=>({...f, wouldWorkAgain: true}))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${form.wouldWorkAgain === true ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' : 'border-dark-400/40 text-dark-300 hover:text-white'}`}>
                    <ThumbsUp size={14} /> Yes
                  </button>
                  <button onClick={() => setForm(f=>({...f, wouldWorkAgain: false}))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${form.wouldWorkAgain === false ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-dark-400/40 text-dark-300 hover:text-white'}`}>
                    <ThumbsDown size={14} /> No
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Your experience</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Tell other drivers about your experience with this broker..."
                value={form.comment}
                onChange={e => setForm(f=>({...f, comment: e.target.value}))} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded"
                  checked={form.isAnonymous}
                  onChange={e => setForm(f=>({...f, isAnonymous: e.target.checked}))} />
                <span className="text-dark-300 text-sm">Submit anonymously</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                <button onClick={handleSubmitReview} disabled={form.rating === 0}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-40">
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-400/40 w-fit">
        {[
          { key: 'reviews', label: `Reviews (${reviews.length})` },
          { key: 'stats',   label: 'Rating Breakdown' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-dark-600 text-white' : 'text-dark-300 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
              <MessageSquare size={32} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-300">No reviews yet. Be the first to review this broker.</p>
            </div>
          ) : reviews.map(review => (
            <div key={review.id} className="glass rounded-xl border border-dark-400/40 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-dark-600 border border-dark-400/40 flex items-center justify-center text-dark-200 text-xs font-bold">
                      {review.isAnonymous ? '?' : review.carrierName.charAt(0)}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {review.isAnonymous ? 'Anonymous Driver' : review.carrierName}
                    </span>
                    {review.wouldWorkAgain === true && (
                      <span className="bg-brand-500/10 text-brand-400 text-xs px-2 py-0.5 rounded-full border border-brand-500/20">
                        ✓ Would work again
                      </span>
                    )}
                    {review.wouldWorkAgain === false && (
                      <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/20">
                        ✗ Would not work again
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} className={i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'} />
                    ))}
                    <span className="text-white text-xs font-semibold">{review.rating}.0</span>
                    <span className="text-dark-500 text-xs">· {new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {review.paymentDays && (
                  <div className={`px-3 py-1.5 rounded-lg border text-center ${review.paymentDays <= 21 ? 'bg-brand-500/10 border-brand-500/20' : review.paymentDays <= 35 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-xs text-dark-400">Paid in</p>
                    <p className={`font-bold text-sm ${review.paymentDays <= 21 ? 'text-brand-400' : review.paymentDays <= 35 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {review.paymentDays} days
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mb-3">
                <SubRating label="Communication" value={review.communication} />
                <SubRating label="Load Accuracy" value={review.accuracy} />
              </div>
              {review.comment && (
                <p className="text-dark-200 text-sm leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="glass rounded-xl border border-dark-400/40 p-6 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Overall Rating', value: broker.rating, max: 5, color: 'brand' },
              { label: 'Communication', value: avgComm, max: 5, color: 'blue' },
              { label: 'Load Accuracy', value: avgAcc, max: 5, color: 'purple' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-dark-700/50 rounded-xl p-4 text-center">
                <p className="text-dark-300 text-xs mb-2">{label}</p>
                <p className={`text-3xl font-black ${color === 'brand' ? 'text-brand-400' : color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {value || '—'}
                </p>
                {value && <p className="text-dark-500 text-xs mt-1">out of 5</p>}
              </div>
            ))}
          </div>

          <div>
            <p className="text-white text-sm font-medium mb-3">Star Distribution</p>
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = reviews.length ? Math.round(count/reviews.length*100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-0.5 w-16">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} className={i<=star?'text-yellow-400 fill-yellow-400':'text-dark-700'} />)}
                  </div>
                  <div className="flex-1 bg-dark-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-dark-400 text-xs w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {wwaPct !== null && (
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{wwaPct}% would work again</p>
                <p className="text-dark-400 text-xs mt-0.5">Based on {reviews.filter(r=>r.wouldWorkAgain!==null).length} responses</p>
              </div>
              <div className={`text-4xl font-black ${wwaPct >= 80 ? 'text-brand-400' : wwaPct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {wwaPct}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
