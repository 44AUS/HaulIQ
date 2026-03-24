import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { loadsApi, bidsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';

export default function PlaceBid() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [existingBid, setExistingBid] = useState(null);

  useEffect(() => {
    loadsApi.get(id)
      .then(data => {
        setLoad(adaptLoad(data));
        setAmount(String(data.rate || ''));
        return bidsApi.my();
      })
      .then(bids => {
        const existing = bids.find(b => String(b.load_id) === String(id));
        if (existing) setExistingBid(existing);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0;
  const pctDiff = load && valid ? (((parsed - load.rate) / load.rate) * 100).toFixed(1) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await bidsApi.place({ load_id: load._raw.id, amount: parsed, note: note.trim() || null });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (!load) return (
    <div className="text-center py-20">
      <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
      <p className="text-dark-300">Load not found.</p>
      <Link to="/carrier/loads" className="text-brand-400 mt-2 inline-block text-sm">Back to Load Board</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(`/carrier/loads/${id}`)} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Load
      </button>

      {/* Load summary */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <p className="text-dark-400 text-xs mb-2">You're bidding on</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-dark-400 text-xs mb-0.5"><MapPin size={10} /> Origin</div>
            <p className="text-white font-semibold">{load.origin}</p>
          </div>
          <div className="text-dark-500 text-sm">→</div>
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-1 text-dark-400 text-xs mb-0.5"><MapPin size={10} /> Destination</div>
            <p className="text-white font-semibold">{load.dest}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-dark-700/50">
          <div>
            <p className="text-dark-400 text-xs">Listed Rate</p>
            <p className="text-white font-bold">${load.rate.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Miles</p>
            <p className="text-white font-bold">{load.miles} mi</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Type</p>
            <p className="text-white font-bold">{load.type}</p>
          </div>
        </div>
      </div>

      {/* Existing bid notice */}
      {existingBid && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          existingBid.status === 'pending'   ? 'bg-yellow-500/10 border-yellow-500/30' :
          existingBid.status === 'accepted'  ? 'bg-brand-500/10 border-brand-500/30' :
          existingBid.status === 'countered' ? 'bg-blue-500/10 border-blue-500/30' :
          'bg-dark-700/50 border-dark-400/30'
        }`}>
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm">You already have a bid on this load</p>
            <p className="text-dark-300 text-sm mt-0.5">
              ${existingBid.amount?.toLocaleString()} — <span className="capitalize">{existingBid.status}</span>
              {existingBid.status === 'countered' && existingBid.counter_amount && (
                <> · Broker countered at <strong className="text-blue-300">${existingBid.counter_amount.toLocaleString()}</strong></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Success state */}
      {submitted ? (
        <div className="glass rounded-xl p-10 border border-brand-500/30 text-center">
          <CheckCircle size={48} className="text-brand-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Bid Submitted!</h2>
          <p className="text-dark-300 text-sm mb-6">
            Your bid of <span className="text-white font-semibold">${parsed.toLocaleString()}</span> has been sent to the broker.
            You'll be notified when they respond.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to={`/carrier/loads/${id}`} className="btn-secondary px-6 py-2.5 text-sm">
              Back to Load
            </Link>
            <Link to="/carrier/loads" className="btn-primary px-6 py-2.5 text-sm">
              Browse More Loads
            </Link>
          </div>
        </div>
      ) : (
        /* Bid form */
        <form onSubmit={handleSubmit} className="glass rounded-xl p-6 border border-dark-400/40 space-y-5">
          <div>
            <h2 className="text-white font-bold text-lg">Place Your Bid</h2>
            <p className="text-dark-400 text-sm mt-0.5">Submit a rate to the broker for this load.</p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">
              Bid Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">
                <DollarSign size={16} />
              </span>
              <input
                type="number"
                min="1"
                step="1"
                className="input pl-10 text-lg font-semibold"
                placeholder={String(load.rate)}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
            {pctDiff !== null && (
              <p className={`text-xs mt-2 font-medium ${parseFloat(pctDiff) >= 0 ? 'text-brand-400' : 'text-yellow-400'}`}>
                {parseFloat(pctDiff) >= 0 ? `+${pctDiff}%` : `${pctDiff}%`} vs listed rate of ${load.rate.toLocaleString()}
              </p>
            )}
            {valid && (
              <p className="text-dark-400 text-xs mt-1">
                ${(parsed / load.miles).toFixed(2)}/mi
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">
              Note to Broker <span className="text-dark-500 font-normal">(optional)</span>
            </label>
            <textarea
              className="input resize-none text-sm"
              rows={4}
              placeholder="Tell the broker why you're the best carrier for this load — experience, equipment, availability..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <p className="text-dark-500 text-xs mt-1">{note.length}/500</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/carrier/loads/${id}`)}
              className="flex-1 btn-secondary py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || submitting}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {submitting
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                : 'Submit Bid'
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
