import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Calendar, Package, Weight, Activity, User, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { BROKER_ACTIVE_LOADS } from '../../data/sampleData';
import { useMessaging } from '../../context/MessagingContext';
import RateConfirmationModal from '../../components/shared/RateConfirmationModal';

const STATUS_CONFIG = {
  quoted:     { label: 'Awaiting Response', cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  booked:     { label: 'Booked',            cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  in_transit: { label: 'In Transit',        cls: 'bg-brand-500/10 text-brand-400 border border-brand-500/20' },
  delivered:  { label: 'Delivered',         cls: 'bg-dark-600 text-dark-400 border border-dark-400/20' },
  available:  { label: 'No Carrier Yet',    cls: 'bg-dark-600 text-dark-300 border border-dark-400/20' },
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

function BrokerLoadCard({ load, onOpenRC, getRCForLoad }) {
  const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.available;
  const rc = getRCForLoad(load.id);

  return (
    <div className="glass rounded-xl p-5 border border-dark-400/30 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-dark-300 text-xs mb-1">Load #{load.id}</p>
          <span className="text-white font-semibold text-sm">{load.type}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>

      {/* Route */}
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
          <p className="text-white font-semibold text-sm truncate">{load.dest}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between mb-4 text-xs text-dark-400">
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Pickup: <span className="text-dark-200">{load.pickup}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Drop: <span className="text-dark-200">{load.delivery}</span></span>
        </div>
      </div>

      {/* RC Status Banner */}
      {(() => {
        if (!rc) return null;
        if (rc.status === 'pending_carrier') return (
          <div className="mb-4 flex items-center justify-between bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm">Awaiting carrier signature on Rate Confirmation</span>
            </div>
            <button onClick={() => onOpenRC(rc)} className="text-yellow-400 hover:text-yellow-300 text-xs underline">View RC</button>
          </div>
        );
        if (rc.status === 'fully_signed') return (
          <div className="mb-4 flex items-center justify-between bg-brand-500/5 border border-brand-500/20 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-brand-400" />
              <span className="text-brand-400 text-sm">Rate Confirmation fully signed</span>
            </div>
            <button onClick={() => onOpenRC(rc)} className="text-brand-400 hover:text-brand-300 text-xs underline">View RC</button>
          </div>
        );
        return null;
      })()}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Rate</p>
          <p className="text-white font-bold text-sm">${load.rate.toLocaleString()}</p>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Miles</p>
          <p className="text-white font-bold text-sm">{load.miles}</p>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Per Mile</p>
          <p className="text-white font-bold text-sm">${load.ratePerMile}</p>
        </div>
      </div>

      {/* Carrier info */}
      <div className="bg-dark-700/40 rounded-lg px-3 py-2.5 mb-3">
        {load.carrierId ? (
          <div className="flex items-center gap-2">
            <User size={13} className="text-dark-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Link
                to={`/carrier-profile/${load.carrierId}`}
                className="text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
              >
                {load.carrierName}
              </Link>
              <span className="text-dark-400 text-xs ml-2">{load.carrierMc}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-dark-400 flex-shrink-0" />
            <span className="text-dark-400 text-sm italic">Awaiting carrier assignment</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-xs text-dark-300 mb-2">
        <span className="flex items-center gap-1"><Package size={10} />{load.commodity}</span>
        <span className="flex items-center gap-1"><Weight size={10} />{load.weight}</span>
      </div>

      {/* No carrier note for available */}
      {load.status === 'available' && (
        <div className="mt-3 bg-dark-700/30 border border-dark-400/20 rounded-lg px-3 py-2">
          <p className="text-dark-400 text-xs">No carrier assigned — load is still open on the board.</p>
        </div>
      )}

      {/* Timeline */}
      <StatusTimeline status={load.status} />
    </div>
  );
}

export default function BrokerLoadsInProgress() {
  const { getRCForLoad } = useMessaging();
  const [rcModal, setRcModal] = useState(null);

  const activeLoads    = BROKER_ACTIVE_LOADS.filter(l => l.status !== 'delivered');
  const deliveredLoads = BROKER_ACTIVE_LOADS.filter(l => l.status === 'delivered');

  const inTransitCount = activeLoads.filter(l => l.status === 'in_transit').length;
  const bookedCount    = activeLoads.filter(l => l.status === 'booked').length;
  const availableCount = activeLoads.filter(l => l.status === 'available').length;
  const deliveredCount = deliveredLoads.length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Activity size={22} className="text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Loads in Progress</h1>
        <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2.5 py-1 rounded-full">
          {activeLoads.length}
        </span>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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
        <div className="stat-card">
          <p className="text-dark-300 text-xs mb-1">Delivered Today</p>
          <p className="text-2xl font-bold text-dark-300">{deliveredCount}</p>
        </div>
      </div>

      {/* Active loads */}
      {activeLoads.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center border border-dark-400/30 mb-6">
          <Activity size={40} className="text-dark-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No active loads</p>
          <p className="text-dark-300 text-sm">Post a load to see it tracked here.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {activeLoads.map(load => (
            <BrokerLoadCard
              key={load.id}
              load={load}
              onOpenRC={setRcModal}
              getRCForLoad={getRCForLoad}
            />
          ))}
        </div>
      )}

      {/* Completed section */}
      {deliveredLoads.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-dark-200 mb-4">Completed</h2>
          <div className="space-y-4">
            {deliveredLoads.map(load => (
              <BrokerLoadCard
                key={load.id}
                load={load}
                onOpenRC={setRcModal}
                getRCForLoad={getRCForLoad}
              />
            ))}
          </div>
        </div>
      )}

      {rcModal && (
        <RateConfirmationModal
          rc={rcModal}
          role="broker"
          onSign={() => {}}
          onClose={() => setRcModal(null)}
        />
      )}
    </div>
  );
}
