import React from 'react';
import { Star, AlertTriangle, Zap, Shield } from 'lucide-react';

const BADGE_MAP = {
  elite:    { label: 'Elite Partner', cls: 'badge-blue',   Icon: Zap },
  trusted:  { label: 'Trusted',       cls: 'badge-green',  Icon: Shield },
  verified: { label: 'Verified',      cls: 'badge-green',  Icon: Shield },
  warning:  { label: 'Warning',       cls: 'badge-red',    Icon: AlertTriangle },
};

export default function BrokerRating({ broker, compact = false }) {
  if (!broker) return null;
  const badge = BADGE_MAP[broker.badge];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Star size={12} className="text-yellow-400 fill-yellow-400" />
        <span className="text-white text-xs font-semibold">{broker.rating}</span>
        <span className="text-dark-300 text-xs">· {broker.name.split(' ')[0]}</span>
        {broker.warns > 0 && <AlertTriangle size={12} className="text-red-400" />}
      </div>
    );
  }

  return (
    <div className="glass-light rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold text-sm">{broker.name}</p>
          <div className="flex items-center gap-1 mt-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12}
                className={i <= Math.round(broker.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-400'} />
            ))}
            <span className="text-white text-xs font-semibold ml-1">{broker.rating}</span>
            <span className="text-dark-300 text-xs">({broker.reviews})</span>
          </div>
        </div>
        {badge && (
          <span className={badge.cls + ' flex items-center gap-1 text-xs'}>
            <badge.Icon size={10} />{badge.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div>
          <p className="text-dark-300">Pay Speed</p>
          <p className={`font-medium mt-0.5 ${broker.paySpeed === 'Quick-Pay' ? 'text-brand-400' : 'text-white'}`}>
            {broker.paySpeed}
          </p>
        </div>
        <div>
          <p className="text-dark-300">Avg Rate</p>
          <p className="text-white font-medium mt-0.5">${broker.avgRate}/mi</p>
        </div>
        {broker.warns > 0 && (
          <div>
            <p className="text-dark-300">Warnings</p>
            <p className="text-red-400 font-medium mt-0.5">{broker.warns} flags</p>
          </div>
        )}
      </div>
    </div>
  );
}
