import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, ThumbsUp, ThumbsDown, CheckCircle, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_CARRIERS, SAMPLE_CARRIER_REVIEWS } from '../../data/sampleData';

function StarInput({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110">
          <Star size={size} className={(hover || value) >= i ? 'text-yellow-400 fill-yellow-400' : 'text-dark-500'} />
        </button>
      ))}
    </div>
  );
}

function MiniBar({ value, max = 5 }) {
  if (!value) return <span className="text-dark-500 text-xs">—</span>;
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-dark-700 rounded-full h-1.5">
        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white text-xs font-medium">{value}</span>
    </div>
  );
}

export default function CarrierProfile() {
  const { carrierId } = useParams();
  const { user } = useAuth();

  const carrier = MOCK_CARRIERS.find(c => c.id === carrierId);
  const reviews = SAMPLE_CARRIER_REVIEWS[carrierId] || [];

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    rating: 0, communication: 0, onTimePickup: 0, onTimeDelivery: 0, loadCare: 0,
    wouldWorkAgain: null, comment: '', isAnonymous: false,
  });

  if (!carrier) return (
    <div className="text-center py-20">
      <p className="text-dark-300">Carrier not found.</p>
      <Link to={-1} className="text-brand-400 mt-2 inline-block">Go back</Link>
    </div>
  );

  const avgOverall = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : carrier.rating;

  const _avg = (key) => {
    const vals = reviews.filter(r => r[key]).map(r => r[key]);
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : null;
  };

  const wwaCount = reviews.filter(r => r.wouldWorkAgain === true).length;
  const wwaPct = reviews.filter(r => r.wouldWorkAgain !== null).length
    ? Math.round(wwaCount / reviews.filter(r => r.wouldWorkAgain !== null).length * 100)
    : null;

  const handleSubmit = () => {
    if (form.rating === 0) return;
    setSubmitted(true);
    setShowForm(false);
  };

  const planColors = { basic: 'text-dark-400', pro: 'text-brand-400', elite: 'text-purple-400' };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link to={-1} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Hero */}
      <div className="glass rounded-xl border border-dark-400/40 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-500/10 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 text-xl font-black flex-shrink-0">
              {carrier.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{carrier.name}</h1>
                <span className={`text-xs font-medium capitalize ${planColors[carrier.plan]}`}>{carrier.plan}</span>
              </div>
              <p className="text-dark-300 text-sm">{carrier.company}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                <span className="flex items-center gap-1"><Truck size={11} />{carrier.mc}</span>
                <span>{carrier.loadsCompleted} loads completed</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white font-bold text-xl">{avgOverall}</span>
            </div>
            <p className="text-dark-400 text-xs">{reviews.length} broker reviews</p>
            {user?.role === 'broker' && !submitted && (
              <button onClick={() => setShowForm(!showForm)}
                className="mt-3 btn-primary text-xs px-3 py-1.5 flex items-center gap-1 ml-auto">
                <Star size={12} /> Review
              </button>
            )}
            {submitted && (
              <div className="mt-3 flex items-center gap-1 justify-end text-brand-400 text-xs">
                <CheckCircle size={12} /> Submitted
              </div>
            )}
          </div>
        </div>

        {/* Sub-rating bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-dark-400/30">
          {[
            { label: 'Communication',    value: _avg('communication') },
            { label: 'On-Time Pickup',   value: _avg('onTimePickup') },
            { label: 'On-Time Delivery', value: _avg('onTimeDelivery') },
            { label: 'Load Care',        value: _avg('loadCare') },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-dark-400 text-xs mb-1.5">{label}</p>
              <MiniBar value={value} />
            </div>
          ))}
        </div>

        {wwaPct !== null && (
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${wwaPct >= 80 ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' : wwaPct >= 60 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <ThumbsUp size={14} /> {wwaPct}% of brokers would book again
          </div>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="glass rounded-xl border border-brand-500/20 p-6">
          <h3 className="text-white font-bold mb-5">Review {carrier.name}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-2">Overall Rating *</label>
              <StarInput value={form.rating} onChange={v => setForm(f=>({...f, rating:v}))} size={28} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'communication',  label: 'Communication' },
                { key: 'onTimePickup',   label: 'On-Time Pickup' },
                { key: 'onTimeDelivery', label: 'On-Time Delivery' },
                { key: 'loadCare',       label: 'Load Care / No Damage' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-dark-100 text-sm font-medium mb-2">{label}</label>
                  <StarInput value={form[key]} onChange={v => setForm(f=>({...f, [key]:v}))} size={18} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-2">Would you book this carrier again?</label>
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
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Your experience</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Describe reliability, professionalism, any issues..."
                value={form.comment} onChange={e => setForm(f=>({...f, comment: e.target.value}))} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isAnonymous}
                  onChange={e => setForm(f=>({...f, isAnonymous: e.target.checked}))} />
                <span className="text-dark-300 text-sm">Submit anonymously</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                <button onClick={handleSubmit} disabled={form.rating === 0}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-40">Submit Review</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-white font-semibold">Broker Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
            <Users size={32} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-300">No reviews yet for this carrier.</p>
          </div>
        ) : reviews.map(review => (
          <div key={review.id} className="glass rounded-xl border border-dark-400/40 p-5">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-xs font-bold">
                    {review.isAnonymous ? '?' : review.brokerName.charAt(0)}
                  </div>
                  <span className="text-white text-sm font-medium">
                    {review.isAnonymous ? 'Anonymous Broker' : review.brokerName}
                  </span>
                  {review.wouldWorkAgain === true && (
                    <span className="bg-brand-500/10 text-brand-400 text-xs px-2 py-0.5 rounded-full border border-brand-500/20">✓ Would book again</span>
                  )}
                  {review.wouldWorkAgain === false && (
                    <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/20">✗ Would not book again</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i<=review.rating?'text-yellow-400 fill-yellow-400':'text-dark-600'} />)}
                  <span className="text-white text-xs font-semibold">{review.rating}.0</span>
                  <span className="text-dark-500 text-xs">· {new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Communication',    value: review.communication },
                { label: 'On-Time Pickup',   value: review.onTimePickup },
                { label: 'On-Time Delivery', value: review.onTimeDelivery },
                { label: 'Load Care',        value: review.loadCare },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-dark-500 text-xs mb-0.5">{label}</p>
                  <MiniBar value={value} />
                </div>
              ))}
            </div>
            {review.comment && <p className="text-dark-200 text-sm leading-relaxed">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
