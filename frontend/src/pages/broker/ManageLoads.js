import React, { useState, useEffect, useCallback } from 'react';
import { Package, Edit, Trash2, Eye, Users, PlusCircle, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import CityAutocomplete from '../../components/shared/CityAutocomplete';

const STATUS_OPTS = ['all', 'active', 'filled', 'expired'];
const EQUIPMENT = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Box Truck'];

function EditModal({ load, onClose, onSaved }) {
  const raw = load._raw;
  const [form, setForm] = useState({
    origin:         raw.origin || '',
    dest:           raw.destination || '',
    miles:          raw.miles || '',
    deadhead:       raw.deadhead_miles || '',
    pickup:         raw.pickup_date || '',
    delivery:       raw.delivery_date || '',
    equipment:      raw.load_type || 'Dry Van',
    weight:         raw.weight_lbs || '',
    commodity:      raw.commodity || '',
    dims:           raw.dimensions || '48x102',
    rate:           raw.rate || '',
    notes:          raw.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    loadsApi.update(raw.id, {
      origin:         form.origin,
      destination:    form.dest,
      miles:          parseInt(form.miles) || undefined,
      deadhead_miles: parseInt(form.deadhead) || 0,
      load_type:      form.equipment,
      weight_lbs:     form.weight ? parseInt(form.weight) : null,
      commodity:      form.commodity || null,
      dimensions:     form.dims,
      pickup_date:    form.pickup || undefined,
      delivery_date:  form.delivery || undefined,
      rate:           parseFloat(form.rate) || undefined,
      notes:          form.notes || null,
    })
      .then(() => { onSaved(); onClose(); })
      .catch(err => { setError(err.message); setSaving(false); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass rounded-xl border border-dark-400/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-dark-400/40">
          <h2 className="text-white font-semibold">Edit Load</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Origin</label>
              <CityAutocomplete value={form.origin} onChange={v => set('origin', v)} required />
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Destination</label>
              <CityAutocomplete value={form.dest} onChange={v => set('dest', v)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Loaded Miles</label>
              <input className="input" type="number" value={form.miles} onChange={e => set('miles', e.target.value)} required />
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Deadhead Miles</label>
              <input className="input" type="number" value={form.deadhead} onChange={e => set('deadhead', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Pickup Date</label>
              <input className="input" type="date" value={form.pickup} onChange={e => set('pickup', e.target.value)} required />
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Delivery Date</label>
              <input className="input" type="date" value={form.delivery} onChange={e => set('delivery', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Equipment Type</label>
              <select className="input cursor-pointer" value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                {EQUIPMENT.map(eq => <option key={eq}>{eq}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Weight (lbs)</label>
              <input className="input" type="number" value={form.weight} onChange={e => set('weight', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Commodity</label>
              <input className="input" value={form.commodity} onChange={e => set('commodity', e.target.value)} />
            </div>
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Dimensions</label>
              <select className="input cursor-pointer" value={form.dims} onChange={e => set('dims', e.target.value)}>
                {['48x102', '53x102', '40x96', '28x102'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-dark-100 text-sm font-medium mb-1.5">Rate (All-In) $</label>
            <input className="input" type="number" value={form.rate} onChange={e => set('rate', e.target.value)} required />
          </div>

          <div>
            <label className="block text-dark-100 text-sm font-medium mb-1.5">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editingLoad, setEditingLoad] = useState(null);

  const fetchLoads = useCallback(() => {
    setLoading(true);
    loadsApi.posted()
      .then(res => {
        const adapted = adaptLoadList(res);
        setLoads(adapted.map(l => ({ ...l, status: l.status === 'removed' ? 'expired' : l.status })));
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleDelete = (load) => {
    loadsApi.delete(load._raw.id)
      .then(() => fetchLoads())
      .catch(err => alert(err.message));
  };

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={22} className="text-brand-400" />Manage Loads</h1>
          <p className="text-dark-300 text-sm mt-1">{loads.filter(l => l.status === 'active').length} active loads</p>
        </div>
        <Link to="/broker/post" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <PlusCircle size={16} /> Post New Load
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
              filter === s ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-dark-400/40 text-dark-300 hover:text-white'
            }`}>
            {s} {s !== 'all' && `(${loads.filter(l => l.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
                <tr>
                  {['Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-400/20">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-dark-400">No loads found</td>
                  </tr>
                ) : filtered.map(load => (
                  <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link to={`/broker/loads/${load._raw.id}`} className="text-white font-medium hover:text-brand-400 transition-colors">
                        {load.origin} → {load.dest}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-dark-300 whitespace-nowrap">{load.type}</td>
                    <td className="px-5 py-4 text-white font-semibold">${(load.rate || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-dark-300 text-xs whitespace-nowrap">{load.pickup}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-dark-200"><Eye size={12} />{load.viewCount || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-dark-200"><Users size={12} />—</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={load.status === 'active' ? 'badge-green' : load.status === 'filled' ? 'badge-blue' : 'badge-red'}>
                        {load.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {load.status === 'active' && (
                          <button
                            onClick={() => setEditingLoad(load)}
                            className="p-1.5 text-dark-300 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
                            title="Edit load">
                            <Edit size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(load)} className="p-1.5 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingLoad && (
        <EditModal
          load={editingLoad}
          onClose={() => setEditingLoad(null)}
          onSaved={fetchLoads}
        />
      )}
    </div>
  );
}
