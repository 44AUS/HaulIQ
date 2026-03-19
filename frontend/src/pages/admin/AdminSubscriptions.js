import React, { useState } from 'react';
import { CreditCard, Edit, Plus, Check, X } from 'lucide-react';
import { CARRIER_PLANS, BROKER_PLANS } from '../../data/sampleData';

const PlanCard = ({ plan, onEdit }) => (
  <div className={`glass rounded-xl p-5 border transition-all ${
    plan.color === 'brand' ? 'border-brand-500/30' : plan.color === 'purple' ? 'border-purple-500/30' : 'border-dark-400/40'
  }`}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold">{plan.name}</h3>
          {plan.popular && <span className="badge-green text-xs">Popular</span>}
        </div>
        <p className="text-dark-300 text-xs mt-0.5">{plan.description}</p>
      </div>
      <button onClick={() => onEdit(plan)} className="p-1.5 text-dark-300 hover:text-white hover:bg-dark-600 rounded-lg transition-colors">
        <Edit size={14} />
      </button>
    </div>
    <p className="text-2xl font-black text-white mb-3">
      {plan.price === 0 ? 'Free' : `$${plan.price}/${plan.period}`}
    </p>
    <ul className="space-y-1.5 mb-4">
      {plan.features.slice(0, 4).map(f => (
        <li key={f} className="flex items-center gap-1.5 text-xs text-dark-200">
          <Check size={11} className="text-brand-400 flex-shrink-0" />{f}
        </li>
      ))}
      {plan.features.length > 4 && <li className="text-dark-400 text-xs ml-4">+{plan.features.length - 4} more</li>}
    </ul>
    <div className="flex gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 rounded-lg">
        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
        <span className="text-brand-400 text-xs font-medium">Active</span>
      </div>
    </div>
  </div>
);

const EditModal = ({ plan, onClose }) => {
  const [price, setPrice] = useState(plan.price);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass rounded-2xl border border-dark-400/60 p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold">Edit Plan: {plan.name}</h2>
          <button onClick={onClose} className="text-dark-300 hover:text-white p-1 rounded-lg hover:bg-dark-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-dark-100 text-sm font-medium mb-1.5">Monthly Price ($)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-dark-100 text-sm font-medium mb-2">Features</label>
            <div className="space-y-2">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check size={12} className="text-brand-400 flex-shrink-0" />
                  <span className="text-dark-200 text-sm flex-1">{f}</span>
                  <button className="text-dark-500 hover:text-red-400 transition-colors"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-dark-400/40">
            <button onClick={onClose} className="flex-1 btn-secondary text-sm py-2">Cancel</button>
            <button onClick={onClose} className="flex-1 btn-primary text-sm py-2">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminSubscriptions() {
  const [tab, setTab] = useState('carrier');
  const [editingPlan, setEditingPlan] = useState(null);

  const plans = tab === 'carrier' ? CARRIER_PLANS : BROKER_PLANS;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard size={22} className="text-brand-400" />Subscription Plans</h1>
          <p className="text-dark-300 text-sm mt-1">Manage pricing and features for all subscription tiers</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Create Plan
        </button>
      </div>

      {/* Subscription summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total MRR', value: '$48,200' },
          { label: 'Carrier Subs', value: '1,284' },
          { label: 'Broker Subs', value: '804' },
          { label: 'Churn Rate', value: '2.1%' },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <p className="text-dark-300 text-xs">{label}</p>
            <p className="text-white text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="inline-flex glass rounded-xl p-1">
        {['carrier', 'broker'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-brand-500 text-white' : 'text-dark-200 hover:text-white'}`}>
            {t === 'carrier' ? '🚛 Carrier Plans' : '📋 Broker Plans'}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {plans.map(plan => <PlanCard key={plan.id} plan={plan} onEdit={setEditingPlan} />)}
      </div>

      {editingPlan && <EditModal plan={editingPlan} onClose={() => setEditingPlan(null)} />}
    </div>
  );
}
