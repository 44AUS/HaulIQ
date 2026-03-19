import React from 'react';
import { Link } from 'react-router-dom';
import { Star, AlertTriangle, Zap, Shield } from 'lucide-react';

const BADGE_MAP = {
  elite:    { label: 'Elite Partner', cls: 'badge-blue',   Icon: Zap },
  trusted:  { label: 'Trusted',       cls: 'badge-green',  Icon: Shield },
  verified: { label: 'Verified',      cls: 'badge-green',  Icon: Shield },
  warning:  { label: 'Warning',       cls: 'badge-red',    Icon: AlertTriangle },
};

function BrokerLogoMini({ logo, name }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (logo) {
    return <img src={logo} alt={name} className="w-7 h-7 rounded-full object-cover border border-dark-400/40 flex-shrink-0" />;
  }
  return (
    <div className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-[9px] font-black flex-shrink-0">
      {initials}
    </div>
  );
}

export default function BrokerRating({ broker, compact = false }) {
  if (!broker) return null;
  const badge = BADGE_MAP[broker.badge];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <BrokerLogoMini logo={broker.logo} name={broker.name} />
        <Star size={12} className="text-yellow-400 fill-yellow-400" />
        <span className="text-white text-xs font-semibold">{broker.rating}</span>
        <Link to={`/broker-profile/${broker.id}`} className="text-dark-300 text-xs hover:text-brand-400 transition-colors">
          · {broker.name.split(' ')[0]}
        </Link>
        {broker.warns > 0 && <AlertTriangle size={12} className="text-red-400" />}
      </div>
    );
  }

  return (
    <div className="glass-light rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <BrokerLogoMini logo={broker.logo} name={broker.name} />
          <div>
            <Link to={`/broker-profile/${broker.id}`} className="text-white font-semibold text-sm hover:text-brand-400 transition-colors">
              {broker.name}
            </Link>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={12}
                  className={i <= Math.round(broker.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-400'} />
              ))}
              <span className="text-white text-xs font-semibold ml-1">{broker.rating}</span>
              <span className="text-dark-300 text-xs">({broker.reviews})</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-dark-300 text-xs">Pay Speed:</p>
              <p className={`text-xs font-medium ${broker.paySpeed === 'Quick-Pay' ? 'text-brand-400' : 'text-white'}`}>
                {broker.paySpeed}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${broker.paySpeedVerified ? 'bg-brand-500/10 text-brand-400' : 'bg-dark-600 text-dark-400'}`}>
                {broker.paySpeedVerified ? '✓ Carrier-verified' : 'Self-reported'}
              </span>
            </div>
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
