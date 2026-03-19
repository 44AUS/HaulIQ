import React from 'react';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

export default function ProfitBadge({ score, net, ratePerMile, size = 'md' }) {
  const configs = {
    green:  { cls: 'badge-green',  Icon: TrendingUp,   label: 'High Profit' },
    yellow: { cls: 'badge-yellow', Icon: Minus,         label: 'Marginal' },
    red:    { cls: 'badge-red',    Icon: TrendingDown,  label: 'Loss Risk' },
  };
  const { cls, Icon, label } = configs[score] || configs.yellow;

  if (size === 'lg') {
    return (
      <div className={`flex flex-col gap-2 p-4 rounded-xl border ${
        score === 'green'  ? 'bg-brand-500/5 border-brand-500/20' :
        score === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/20' :
                             'bg-red-500/5 border-red-500/20'
      }`}>
        <div className={cls}><Icon size={12} />{label}</div>
        {net !== undefined && (
          <p className={`text-2xl font-bold ${
            score === 'green'  ? 'text-brand-400' :
            score === 'yellow' ? 'text-yellow-400' : 'text-red-400'
          }`}>${net.toLocaleString()} net</p>
        )}
        {ratePerMile && <p className="text-dark-200 text-xs">${ratePerMile}/mi</p>}
      </div>
    );
  }

  return <span className={cls}><Icon size={10} />{label}</span>;
}
