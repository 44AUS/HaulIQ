import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, Phone, MessageSquare, Bookmark, BookmarkCheck, AlertTriangle } from 'lucide-react';
import { LOADS } from '../../data/sampleData';
import ProfitBadge from '../../components/shared/ProfitBadge';
import BrokerRating from '../../components/shared/BrokerRating';

export default function LoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const load = LOADS.find(l => l.id === id);
  const [saved, setSaved] = useState(load?.saved || false);

  if (!load) return (
    <div className="text-center py-20">
      <p className="text-dark-300">Load not found.</p>
      <Link to="/carrier/loads" className="text-brand-400 mt-2 inline-block">Back to Load Board</Link>
    </div>
  );

  const fuelCostEst = load.fuel;
  const deadheadCost = Math.round(load.deadhead * 0.62);
  const grossRevenue = load.rate;
  const expenses = fuelCostEst + deadheadCost + 120; // +misc
  const netProfit = grossRevenue - expenses;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Load Board
      </button>

      {/* Load header */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {load.hot && <span className="badge-red flex items-center gap-1">🔥 Hot Load</span>}
              <span className="badge-blue flex items-center gap-1"><Truck size={10} />{load.type}</span>
              <span className="text-dark-300 text-xs">{load.posted}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{load.origin} → {load.dest}</h1>
            <p className="text-dark-300 text-sm mt-1">{load.commodity} · {load.weight} · {load.miles} loaded miles</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSaved(!saved)}
              className={`p-2.5 rounded-lg border transition-all ${saved ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' : 'border-dark-400/40 text-dark-300 hover:text-white hover:border-dark-300'}`}>
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Route details */}
          <div className="glass rounded-xl p-6 border border-dark-400/40">
            <h2 className="text-white font-semibold mb-4">Route Details</h2>
            <div className="space-y-4">
              {[
                { label: 'Pickup', value: load.origin, sub: load.pickup, icon: MapPin, color: 'text-brand-400' },
                { label: 'Delivery', value: load.dest, sub: load.delivery, icon: MapPin, color: 'text-red-400' },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div>
                    <p className="text-dark-300 text-xs">{label}</p>
                    <p className="text-white font-medium text-sm">{value}</p>
                    <p className="text-dark-400 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-dark-400/30">
              {[
                ['Loaded Miles', `${load.miles} mi`],
                ['Deadhead', `${load.deadhead} mi`],
                ['Dimensions', load.dims],
              ].map(([k, v]) => (
                <div key={k} className="bg-dark-700/50 rounded-lg p-3">
                  <p className="text-dark-300 text-xs">{k}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profit breakdown */}
          <div className="glass rounded-xl p-6 border border-dark-400/40">
            <h2 className="text-white font-semibold mb-4">Profit Breakdown</h2>
            <div className="space-y-3 mb-5">
              {[
                { label: 'Gross Rate', value: `+$${grossRevenue.toLocaleString()}`, cls: 'text-brand-400' },
                { label: `Fuel (~${load.miles} mi)`, value: `-$${fuelCostEst}`, cls: 'text-red-400' },
                { label: `Deadhead (${load.deadhead} mi)`, value: `-$${deadheadCost}`, cls: 'text-red-400' },
                { label: 'Misc / tolls', value: '-$120', cls: 'text-red-400' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-dark-400/20">
                  <span className="text-dark-200 text-sm">{label}</span>
                  <span className={`font-semibold text-sm ${cls}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-white font-bold">Estimated Net Profit</span>
                <span className={`text-xl font-black ${netProfit > 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                </span>
              </div>
            </div>
            <ProfitBadge score={load.profitScore} net={netProfit} ratePerMile={load.ratePerMile} size="lg" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Broker */}
          <div className="glass rounded-xl p-5 border border-dark-400/40">
            <h2 className="text-white font-semibold text-sm mb-3">Broker</h2>
            <BrokerRating broker={load.broker} />
          </div>

          {/* Quick stats */}
          <div className="glass rounded-xl p-5 border border-dark-400/40 space-y-3">
            <h2 className="text-white font-semibold text-sm">Quick Stats</h2>
            {[
              { label: 'Rate', value: `$${load.rate.toLocaleString()}` },
              { label: 'Per Mile', value: `$${load.ratePerMile}` },
              { label: 'Weight', value: load.weight },
              { label: 'Commodity', value: load.commodity },
            ].map(([label, value]) => typeof label === 'string' && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-dark-300">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-2.5">
            <button className="btn-primary w-full py-3 flex items-center justify-center gap-2 glow-green">
              <Phone size={16} /> Contact Broker
            </button>
            <button className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
              <MessageSquare size={16} /> Send Offer
            </button>
          </div>

          {/* Warning if bad broker */}
          {load.broker.warns > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-red-400" />
                <p className="text-red-400 font-semibold text-sm">Broker Warning</p>
              </div>
              <p className="text-red-300/70 text-xs leading-relaxed">
                This broker has {load.broker.warns} active warning flag{load.broker.warns > 1 ? 's' : ''} from other drivers. Proceed with caution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
