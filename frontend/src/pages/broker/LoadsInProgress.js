import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Calendar, Package, Weight, Activity, User, AlertCircle } from 'lucide-react';
import { bookingsApi } from '../../services/api';

const STATUS_CONFIG = {
  booked:     { label: 'Booked',         cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  in_transit: { label: 'In Transit',     cls: 'bg-brand-500/10 text-brand-400 border border-brand-500/20' },
  delivered:  { label: 'Delivered',      cls: 'bg-dark-600 text-dark-400 border border-dark-400/20' },
  available:  { label: 'No Carrier Yet', cls: 'bg-dark-600 text-dark-300 border border-dark-400/20' },
};

const TIMELINE_STEPS = ['Quoted', 'Booked', 'In Transit', 'Delivered'];
const STATUS_STEP = { quoted: 0, booked: 1, in_transit: 2, delivered: 3, available: -1 };

function StatusTimeline({ status }) {
  const current = STATUS_STEP[status] ?? -1;
  if (current < 0) return null;
  return (
    <div className="flex items-center w-full mt-4">
      {TIMELINE_STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        const future = idx > current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all
                ${done   ? 'bg-brand-500' : ''}
                ${active ? 'bg-brand-500 ring-2 ring-brand-400/40 ring-offset-1 ring-offset-dark-800' : ''}
                ${future ? 'bg-dark-600 border border-dark-400/40' : ''}
              `}>
                {done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${active ? 'text-brand-400 font-semibold' : done ? 'text-brand-400/60' : 'text-dark-400'}`}>
                {step}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 ${done ? 'bg-brand-500' : 'border-t border-dashed border-dark-500'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BrokerLoadCard({ load }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;

  return (
    <div className="glass rounded-xl p-5 border border-dark-400/30 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-dark-300 text-xs mb-1">Load #{load.id.slice(0, 8)}</p>
          <span className="text-white font-semibold text-sm">{load.load_type}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-dark-300 text-xs mb-0.5">
            <MapPin size={10} /> Origin
          </div>
          <p className="text-white font-semibold text-sm truncate">{load.origin}</p>
        </div>
        <div className="flex flex-col items-center">
          <ArrowRight size={16} className="text-dark-400" />
          <span className="text-dark-300 text-xs mt-0.5">{load.miles}mi</span>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-1 text-dark-300 text-xs mb-0.5">
            <MapPin size={10} /> Dest
          </div>
          <p className="text-white font-semibold text-sm truncate">{load.destination}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-xs text-dark-400">
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Pickup: <span className="text-dark-200">{load.pickup_date}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Drop: <span className="text-dark-200">{load.delivery_date}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Rate</p>
          <p className="text-white font-bold text-sm">${(load.rate || 0).toLocaleString()}</p>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Miles</p>
          <p className="text-white font-bold text-sm">{load.miles}</p>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Per Mile</p>
          <p className="text-white font-bold text-sm">${(load.rate_per_mile || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-dark-700/40 rounded-lg px-3 py-2.5 mb-3">
        {load.carrier_id ? (
          <div className="flex items-center gap-2">
            <User size={13} className="text-dark-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Link
                to={`/carrier-profile/${load.carrier_id}`}
                className="text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
              >
                {load.carrier_name}
              </Link>
              {load.carrier_mc && <span className="text-dark-400 text-xs ml-2">MC-{load.carrier_mc}</span>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-dark-400 flex-shrink-0" />
            <span className="text-dark-400 text-sm italic">Awaiting carrier assignment</span>
          </div>
        )}
      </div>

      {load.commodity && (
        <div className="flex items-center gap-4 text-xs text-dark-300 mb-2">
          <span className="flex items-center gap-1"><Package size={10} />{load.commodity}</span>
          {load.weight_lbs && <span className="flex items-center gap-1"><Weight size={10} />{Number(load.weight_lbs).toLocaleString()} lbs</span>}
        </div>
      )}

      {load.status === 'available' && (
        <div className="mt-3 bg-dark-700/30 border border-dark-400/20 rounded-lg px-3 py-2">
          <p className="text-dark-400 text-xs">No carrier assigned — load is still open on the board.</p>
        </div>
      )}

      <StatusTimeline status={load.status} />
    </div>
  );
}

export default function BrokerLoadsInProgress() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.brokerActive()
      .then(data => setLoads(Array.isArray(data) ? data : []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, []);

  const inTransitCount = loads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = loads.filter(l => l.status === 'booked').length;
  const availableCount = loads.filter(l => l.status === 'available').length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Activity size={22} className="text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Loads in Progress</h1>
        <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2.5 py-1 rounded-full">
          {loads.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-dark-300 text-xs mb-1">In Transit</p>
          <p className="text-2xl font-bold text-brand-400">{inTransitCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-dark-300 text-xs mb-1">Booked</p>
          <p className="text-2xl font-bold text-blue-400">{bookedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-dark-300 text-xs mb-1">Not Filled</p>
          <p className="text-2xl font-bold text-dark-200">{availableCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : loads.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border border-dark-400/30">
          <Activity size={40} className="text-dark-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No active loads</p>
          <p className="text-dark-300 text-sm">Post a load to see it tracked here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loads.map(load => (
            <BrokerLoadCard key={load.id} load={load} />
          ))}
        </div>
      )}
    </div>
  );
}
