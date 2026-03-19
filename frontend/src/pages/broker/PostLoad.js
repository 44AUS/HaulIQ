import React, { useState } from 'react';
import { PlusCircle, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadsApi } from '../../services/api';

const EQUIPMENT = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Box Truck'];

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
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePost = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      origin:         form.origin,
      destination:    form.dest,
      miles:          parseInt(form.miles) || 0,
      deadhead_miles: parseInt(form.deadhead || 0),
      load_type:      { 'Dry Van': 'dry_van', 'Reefer': 'reefer', 'Flatbed': 'flatbed' }[form.equipment] || 'dry_van',
      weight_lbs:     form.weight ? parseInt(form.weight) : null,
      commodity:      form.commodity,
      pickup_date:    form.pickup,
      delivery_date:  form.delivery,
      rate:           parseFloat(form.rate),
      notes:          form.notes || null,
    };
    loadsApi.post(payload)
      .then(() => navigate('/broker/loads'))
      .catch(err => { setError(err.message); setSubmitting(false); });
  };

  const Field = ({ label, id, type = 'text', placeholder, required, children }) => (
    <div>
      <label className="block text-dark-100 text-sm font-medium mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
      {children || <input type={type} value={form[id]} onChange={e => set(id, e.target.value)} className="input" placeholder={placeholder} required={required} />}
    </div>
  );

  if (posted) return (
    <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
      <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-5 glow-green">
        <Check size={28} className="text-brand-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Load Posted!</h2>
      <p className="text-dark-300 text-sm">Your load is now live on the board. Carriers will see it immediately.</p>
      <button onClick={() => setPosted(false)} className="btn-primary mt-6 px-6 py-2.5 text-sm">Post Another</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><PlusCircle size={22} className="text-brand-400" />Post a Load</h1>
        <p className="text-dark-300 text-sm mt-1">Fill out the details and your load will be live instantly</p>
      </div>

      <form onSubmit={handlePost} className="glass rounded-xl p-6 border border-dark-400/40 space-y-5">
        {/* Route */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Origin City, State" id="origin" placeholder="Chicago, IL" required />
          <Field label="Destination City, State" id="dest" placeholder="Atlanta, GA" required />
        </div>

        {/* Miles */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Loaded Miles" id="miles" placeholder="716" required />
          <Field label="Deadhead Miles" id="deadhead" placeholder="0" />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pickup Date" id="pickup" type="date" required />
          <Field label="Delivery Date" id="delivery" type="date" required />
        </div>

        {/* Equipment */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Equipment Type" id="equipment">
            <select value={form.equipment} onChange={e => set('equipment', e.target.value)} className="input cursor-pointer">
              {EQUIPMENT.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Weight (lbs)" id="weight" placeholder="42000" />
        </div>

        {/* Commodity + dims */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Commodity" id="commodity" placeholder="General Freight" />
          <Field label="Dimensions" id="dims">
            <select value={form.dims} onChange={e => set('dims', e.target.value)} className="input cursor-pointer">
              {['48x102', '53x102', '40x96', '28x102'].map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-dark-100 text-sm font-medium mb-1.5">Rate (All-In) <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-sm">$</span>
            <input type="number" value={form.rate} onChange={e => set('rate', e.target.value)} className="input pl-7" placeholder="2500" required />
          </div>
          {form.rate && (
            <p className="text-dark-400 text-xs mt-1">
              Market context: avg for similar loads is ~$2.80-3.20/mi
              {form.rate < 1500 && <span className="text-yellow-400 ml-2">— May appear in "Worst Loads" feed</span>}
            </p>
          )}
        </div>

        {/* Notes */}
        <Field label="Special Instructions" id="notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            className="input resize-none" rows={3} placeholder="Any special requirements, hazmat info, contact details..." />
        </Field>

        {error && (
          <div className="glass rounded-xl border border-red-500/20 p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2 glow-green disabled:opacity-60">
          {submitting ? 'Posting...' : <><span>Post Load Live</span><ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}
