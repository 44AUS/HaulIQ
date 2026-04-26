import { useState, useEffect, useCallback } from 'react';
import { IonModal } from '@ionic/react';
import { plansApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };
const selectStyle = { ...inputStyle, padding: '7px 12px' };

const COLOR_OPTIONS = [
  { value: 'default', label: 'Default (grey)' },
  { value: 'brand',   label: 'Brand (blue/teal)' },
  { value: 'purple',  label: 'Purple' },
];

const TIER_OPTIONS = ['basic', 'pro', 'elite'];

const EMPTY_FORM = {
  name: '', role: 'carrier', tier: 'pro', price: '', description: '',
  features: '', missing: '', popular: false, color: 'brand', sort_order: 0,
};

function PlanModal({ open, plan, onClose, onSaved }) {
  const editing = Boolean(plan?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (plan) {
        setForm({
          name: plan.name || '', role: plan.role || 'carrier', tier: plan.tier || 'pro',
          price: plan.price ?? '', description: plan.description || '',
          features: (plan.features || []).join('\n'),
          missing: (plan.limits?.missing || []).join('\n'),
          popular: plan.limits?.popular || false,
          color: plan.limits?.color || 'brand',
          sort_order: plan.limits?.sort_order ?? 0,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError(null);
    }
  }, [open, plan]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (form.price === '' || isNaN(Number(form.price))) { setError('Valid price is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(), role: form.role, tier: form.tier, price: Number(form.price),
        description: form.description.trim(),
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
        limits: {
          missing: form.missing.split('\n').map(s => s.trim()).filter(Boolean),
          popular: form.popular, color: form.color, sort_order: Number(form.sort_order) || 0,
        },
      };
      editing ? await plansApi.adminUpdate(plan.id, payload) : await plansApi.adminCreate(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal isOpen={open} onDidDismiss={onClose} style={{ '--width': '540px', '--height': 'auto', '--max-height': '92vh', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>{editing ? 'Edit Plan' : 'New Plan'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}><IonIcon name="close-outline" style={{ fontSize: 20 }} /></button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ padding: '8px 12px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.82rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Plan Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Pro" />
            </div>
            <div style={{ width: 130 }}>
              <label style={labelStyle}>Price ($/mo) *</label>
              <input style={inputStyle} type="number" value={form.price} onChange={e => set('price', e.target.value)} min={0} step={1} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Role</label>
              <select style={selectStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="carrier">Carrier</option>
                <option value="broker">Broker</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tier</label>
              <select style={selectStyle} value={form.tier} onChange={e => set('tier', e.target.value)}>
                {TIER_OPTIONS.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Color</label>
              <select style={selectStyle} value={form.color} onChange={e => set('color', e.target.value)}>
                {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description shown on pricing card" />
          </div>
          <div>
            <label style={labelStyle}>Included Features (one per line)</label>
            <textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }} value={form.features} onChange={e => set('features', e.target.value)} placeholder={'Unlimited load views\nFull profit calculator\nPriority support'} />
            <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)' }}>Each line becomes a ✓ bullet on the pricing card</span>
          </div>
          <div>
            <label style={labelStyle}>Not Included Features (one per line)</label>
            <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.missing} onChange={e => set('missing', e.target.value)} placeholder={'Advanced AI insights\nEarly load access'} />
            <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)' }}>Each line becomes a ✗ struck-through bullet</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
              <input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} style={{ accentColor: 'var(--ion-color-primary)', width: 16, height: 16 }} />
              Mark as Most Popular
            </label>
            <div>
              <label style={labelStyle}>Sort Order</label>
              <input style={{ ...inputStyle, width: 100 }} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} min={0} />
              <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)' }}>Lower = first</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ion-border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '7px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </div>
    </IonModal>
  );
}

function PlanCard({ plan, onEdit, onDelete, onToggle }) {
  const popular = plan.limits?.popular || false;
  const missing = plan.limits?.missing || [];

  return (
    <div style={{ ...cardStyle, padding: 20, position: 'relative', opacity: plan.is_active ? 1 : 0.5 }}>
      {popular && (
        <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--ion-color-primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 12, whiteSpace: 'nowrap' }}>
          Most Popular
        </span>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ion-text-color)' }}>{plan.name}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{plan.description}</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <label title={plan.is_active ? 'Deactivate' : 'Activate'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" checked={plan.is_active} onChange={() => onToggle(plan)} style={{ accentColor: 'var(--ion-color-primary)', width: 16, height: 16 }} />
          </label>
          <button title="Edit" onClick={() => onEdit(plan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
            <IonIcon name="create-outline" style={{ fontSize: 16 }} />
          </button>
          <button title="Delete" onClick={() => onDelete(plan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
            <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>${plan.price}</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>/mo</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ border: '1px solid var(--ion-border-color)', color: 'var(--ion-color-medium)', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem' }}>{plan.role}</span>
        <span style={{ border: '1px solid var(--ion-border-color)', color: 'var(--ion-color-medium)', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem' }}>{plan.tier}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(plan.features || []).slice(0, 4).map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IonIcon name="checkmark-circle-outline" style={{ fontSize: 13, color: '#2e7d32', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ion-text-color)' }}>{f}</span>
          </div>
        ))}
        {(plan.features || []).length > 4 && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>+{plan.features.length - 4} more features</span>}
        {missing.slice(0, 2).map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.45 }}>
            <IonIcon name="reorder-three-outline" style={{ fontSize: 13, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ion-color-medium)' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const tabBtnStyle = (active) => ({
  flex: 1, padding: '8px 12px', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: active ? 600 : 400,
  background: 'none', border: 'none', borderBottom: active ? '2px solid var(--ion-color-primary)' : '2px solid transparent',
  color: active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', cursor: 'pointer',
});

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [tab, setTab] = useState('carrier');

  const load = useCallback(() => {
    setLoading(true);
    plansApi.adminList().then(setPlans).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (plan) => { setEditingPlan(plan); setDialogOpen(true); };
  const handleNew  = ()     => { setEditingPlan(null);  setDialogOpen(true); };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try { await plansApi.adminDelete(plan.id); load(); }
    catch (e) { alert(e.message || 'Delete failed'); }
  };

  const handleToggle = async (plan) => {
    try { await plansApi.adminUpdate(plan.id, { is_active: !plan.is_active }); load(); }
    catch (e) { alert(e.message || 'Update failed'); }
  };

  const filtered = plans.filter(p => p.role === tab).sort((a, b) => ((a.limits?.sort_order ?? 99) - (b.limits?.sort_order ?? 99)) || a.price - b.price);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Pricing Plans</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Manage what appears on the landing page pricing section</p>
        </div>
        <button onClick={handleNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
          <IonIcon name="add-outline" style={{ fontSize: 16 }} /> New Plan
        </button>
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ion-border-color)', marginBottom: 24 }}>
        {['carrier', 'broker'].map(t => (
          <button key={t} style={tabBtnStyle(tab === t)} onClick={() => setTab(t)}>
            {t === 'carrier' ? '🚛 Carriers' : '📋 Brokers'} ({plans.filter(p => p.role === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...cardStyle, height: 280 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p style={{ margin: '0 0 12px', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No {tab} plans yet.</p>
          <button onClick={handleNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer' }}>
            <IonIcon name="add-outline" /> Create First Plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      <PlanModal open={dialogOpen} plan={editingPlan} onClose={() => setDialogOpen(false)} onSaved={load} />
    </div>
  );
}
