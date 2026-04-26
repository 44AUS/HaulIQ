import React, { useState, useEffect } from 'react';
import { IonModal } from '@ionic/react';
import { adminApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, marginBottom: 8 }} />;
}

function EditModal({ plan, onClose, onSaved }) {
  const [price, setPrice] = useState(String(plan.price));
  const [description, setDescription] = useState(plan.description || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const params = {};
      const newPrice = parseFloat(price);
      if (!isNaN(newPrice) && newPrice !== plan.price) params.price = newPrice;
      if (description !== (plan.description || '')) params.description = description;
      if (Object.keys(params).length > 0) {
        const updated = await adminApi.updatePlan(plan.id, params);
        onSaved(updated);
      } else {
        onClose();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '400px', '--height': 'auto', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Edit Plan: {plan.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Monthly Price ($)</label>
            <input style={inputStyle} type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {plan.features?.length > 0 && (
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--ion-text-color)' }}>Features</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IonIcon name="checkmark-outline" style={{ fontSize: 13, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '8px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </IonModal>
  );
}

function PlanCard({ plan, onEdit }) {
  const borderColor = plan.tier === 'elite' ? '#7b1fa2' : plan.tier === 'pro' ? 'var(--ion-color-primary)' : 'var(--ion-border-color)';
  return (
    <div style={{ ...cardStyle, border: `1px solid ${borderColor}`, padding: 20, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize', color: 'var(--ion-text-color)' }}>{plan.name}</span>
            {plan.tier === 'pro' && <span style={{ backgroundColor: '#2e7d32', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>Popular</span>}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{plan.description || '—'}</span>
        </div>
        <button onClick={() => onEdit(plan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 4 }}>
          <IonIcon name="create-outline" style={{ fontSize: 16 }} />
        </button>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>
        {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
      </p>
      {plan.features?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginBottom: 12 }}>
          {plan.features.slice(0, 4).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IonIcon name="checkmark-outline" style={{ fontSize: 13, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--ion-text-color)' }}>{f}</span>
            </div>
          ))}
          {plan.features.length > 4 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>+{plan.features.length - 4} more</span>
          )}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IonIcon name="ellipse" style={{ fontSize: 8, color: plan.is_active ? '#2e7d32' : '#d32f2f' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: plan.is_active ? '#2e7d32' : '#d32f2f' }}>
          {plan.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

const tabBtnStyle = (active) => ({
  flex: 1, padding: '8px 12px', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: active ? 600 : 400,
  background: 'none', border: 'none', borderBottom: active ? '2px solid var(--ion-color-primary)' : '2px solid transparent',
  color: active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', cursor: 'pointer',
});

export default function AdminSubscriptions() {
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    adminApi.plans().then(setPlans).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const carrierPlans = plans.filter(p => p.role === 'carrier');
  const brokerPlans  = plans.filter(p => p.role === 'broker');
  const visiblePlans = tab === 0 ? carrierPlans : brokerPlans;

  function handleSaved(updated) {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingPlan(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <IonIcon name="card-outline" style={{ color: 'var(--ion-color-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>Subscription Plans</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Manage pricing and features for all subscription tiers</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...cardStyle, padding: 20 }}>
              <SkeletonBox width="60%" height={20} />
              <SkeletonBox width="80%" height={16} />
              <SkeletonBox width="50%" height={16} />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--ion-border-color)', marginBottom: 24 }}>
            <button style={tabBtnStyle(tab === 0)} onClick={() => setTab(0)}>Carrier Plans ({carrierPlans.length})</button>
            <button style={tabBtnStyle(tab === 1)} onClick={() => setTab(1)}>Broker Plans ({brokerPlans.length})</button>
          </div>
          {visiblePlans.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '0.875rem', padding: '32px 0' }}>No plans found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {visiblePlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} onEdit={setEditingPlan} />
              ))}
            </div>
          )}
        </div>
      )}

      {editingPlan && <EditModal plan={editingPlan} onClose={() => setEditingPlan(null)} onSaved={handleSaved} />}
    </div>
  );
}
