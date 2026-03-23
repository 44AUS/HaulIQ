import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Check, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadsApi } from '../../services/api';
import CityAutocomplete from '../../components/shared/CityAutocomplete';
import { getDrivingMiles } from '../../services/routing';

const EQUIPMENT = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Box Truck'];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-dark-100 text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function PostLoad() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: '', dest: '', pickup: '', delivery: '',
    equipment: 'Dry Van', weight: '', dims: '48x102',
    commodity: '', rate: '', miles: '', deadhead: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [posted, setPosted] = useState(false);
  const [calcingMiles, setCalcingMiles] = useState(false);
  const milesTimer = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calculate driving miles when both origin and dest look complete
  useEffect(() => {
    const { origin, dest } = form;
    if (!origin.includes(',') || !dest.includes(',')) return;
    clearTimeout(milesTimer.current);
    milesTimer.current = setTimeout(() => {
      setCalcingMiles(true);
      getDrivingMiles(origin, dest)
        .then(miles => { if (miles) set('miles', String(miles)); })
        .finally(() => setCalcingMiles(false));
    }, 600);
    return () => clearTimeout(milesTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.origin, form.dest]);

  const handlePost = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    loadsApi.post({
      origin:         form.origin,
      destination:    form.dest,
      miles:          parseInt(form.miles) || 0,
      deadhead_miles: parseInt(form.deadhead) || 0,
      load_type:      form.equipment,
      weight_lbs:     form.weight ? parseInt(form.weight) : null,
      commodity:      form.commodity || null,
      pickup_date:    form.pickup,
      delivery_date:  form.delivery,
      rate:           parseFloat(form.rate),
      notes:          form.notes || null,
    })
      .then(() => setPosted(true))
      .catch(err => { setError(err.message); setSubmitting(false); });
  };

  if (posted) return (
    <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
      <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-5 glow-green">
        <Check size={28} className="text-brand-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Load Posted!</h2>
      <p className="text-dark-300 text-sm">Your load is now live on the board. Carriers will see it immediately.</p>
      <div className="flex gap-3 justify-center mt-6">
        <button onClick={() => { setPosted(false); setForm({ origin: '', dest: '', pickup: '', delivery: '', equipment: 'Dry Van', weight: '', dims: '48x102', commodity: '', rate: '', miles: '', deadhead: '', notes: '' }); }}
          className="btn-secondary px-6 py-2.5 text-sm">Post Another</button>
        <button onClick={() => navigate('/broker/loads')} className="btn-primary px-6 py-2.5 text-sm">View Loads</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <PlusCircle size={22} className="text-brand-400" />Post a Load
        </h1>
        <p className="text-dark-300 text-sm mt-1">Fill out the details and your load will be live instantly</p>
      </div>

      <form onSubmit={handlePost} className="glass rounded-xl p-6 border border-dark-400/40 space-y-5">
        {/* Route */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Origin City, State" required>
            <CityAutocomplete value={form.origin} onChange={v => set('origin', v)} placeholder="Chicago, IL" required />
          </Field>
          <Field label="Destination City, State" required>
            <CityAutocomplete value={form.dest} onChange={v => set('dest', v)} placeholder="Atlanta, GA" required />
          </Field>
        </div>

        {/* Miles — auto-calculated, still editable */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Loaded Miles" required>
            <div className="relative">
              <input
                type="number"
                className="input pr-8"
                value={form.miles}
                onChange={e => set('miles', e.target.value)}
                placeholder={calcingMiles ? 'Calculating…' : '716'}
                required
              />
              {calcingMiles && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 animate-spin">
                  <Loader size={13} />
                </div>
              )}
            </div>
            {form.miles && !calcingMiles && (
              <p className="text-dark-500 text-xs mt-1">Auto-calculated · edit if needed</p>
            )}
          </Field>
          <Field label="Deadhead Miles">
            <input type="number" className="input" value={form.deadhead}
              onChange={e => set('deadhead', e.target.value)} placeholder="0" />
          </Field>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pickup Date" required>
            <input type="date" className="input" value={form.pickup}
              onChange={e => set('pickup', e.target.value)} required />
          </Field>
          <Field label="Delivery Date" required>
            <input type="date" className="input" value={form.delivery}
              onChange={e => set('delivery', e.target.value)} required />
          </Field>
        </div>

        {/* Equipment */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Equipment Type">
            <select value={form.equipment} onChange={e => set('equipment', e.target.value)} className="input cursor-pointer">
              {EQUIPMENT.map(eq => <option key={eq}>{eq}</option>)}
            </select>
          </Field>
          <Field label="Weight (lbs)">
            <input type="number" className="input" value={form.weight}
              onChange={e => set('weight', e.target.value)} placeholder="42000" />
          </Field>
        </div>

        {/* Commodity + dims */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Commodity">
            <input className="input" value={form.commodity}
              onChange={e => set('commodity', e.target.value)} placeholder="General Freight" />
          </Field>
          <Field label="Dimensions">
            <select value={form.dims} onChange={e => set('dims', e.target.value)} className="input cursor-pointer">
              {['48x102', '53x102', '40x96', '28x102'].map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-dark-100 text-sm font-medium mb-1.5">
            Rate (All-In) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-sm">$</span>
            <input type="number" value={form.rate} onChange={e => set('rate', e.target.value)}
              className="input pl-7" placeholder="2500" required />
          </div>
          {form.rate && (
            <p className="text-dark-400 text-xs mt-1">
              Market context: avg for similar loads is ~$2.80-3.20/mi
              {parseFloat(form.rate) < 1500 && <span className="text-yellow-400 ml-2">— May appear in "Worst Loads" feed</span>}
            </p>
          )}
        </div>

        {/* Notes */}
        <Field label="Special Instructions">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            className="input resize-none" rows={3}
            placeholder="Any special requirements, hazmat info, contact details..." />
        </Field>

        {error && (
          <div className="glass rounded-xl border border-red-500/20 p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 glow-green disabled:opacity-60">
          {submitting ? 'Posting...' : <><span>Post Load Live</span><ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}
