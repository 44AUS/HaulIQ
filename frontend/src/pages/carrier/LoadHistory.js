import React from 'react';
import { History, TrendingUp, Minus, TrendingDown } from 'lucide-react';

const HISTORY = [
  { id: 'H001', date: '2026-03-15', origin: 'Chicago, IL', dest: 'Atlanta, GA', rate: 2850, net: 1890, score: 'green', broker: 'MoLo Solutions', miles: 716 },
  { id: 'H002', date: '2026-03-12', origin: 'Atlanta, GA', dest: 'Miami, FL', rate: 1800, net: 980, score: 'yellow', broker: 'Echo Global', miles: 662 },
  { id: 'H003', date: '2026-03-08', origin: 'Miami, FL', dest: 'New York, NY', rate: 4200, net: 2340, score: 'green', broker: 'Arrive Logistics', miles: 1280 },
  { id: 'H004', date: '2026-03-05', origin: 'New York, NY', dest: 'Chicago, IL', rate: 2200, net: 1340, score: 'green', broker: 'Coyote Logistics', miles: 790 },
  { id: 'H005', date: '2026-02-28', origin: 'Chicago, IL', dest: 'Dallas, TX', rate: 1600, net: 420, score: 'yellow', broker: 'BlueSky Transport', miles: 924 },
  { id: 'H006', date: '2026-02-22', origin: 'Dallas, TX', dest: 'Denver, CO', rate: 1100, net: -120, score: 'red', broker: 'Freight Broker LLC', miles: 1032 },
];

const ScoreIcon = ({ score }) => {
  if (score === 'green') return <TrendingUp size={14} className="text-brand-400" />;
  if (score === 'yellow') return <Minus size={14} className="text-yellow-400" />;
  return <TrendingDown size={14} className="text-red-400" />;
};

export default function LoadHistory() {
  const totalNet = HISTORY.reduce((s, l) => s + l.net, 0);
  const totalGross = HISTORY.reduce((s, l) => s + l.rate, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><History size={22} className="text-brand-400" />Load History</h1>
        <p className="text-dark-300 text-sm mt-1">Your completed loads</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Gross', value: `$${totalGross.toLocaleString()}` },
          { label: 'Total Net', value: `$${totalNet.toLocaleString()}`, highlight: true },
          { label: 'Loads Completed', value: HISTORY.length },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="stat-card">
            <p className="text-dark-300 text-xs">{label}</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-brand-400' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
              <tr>
                {['Date', 'Route', 'Miles', 'Rate', 'Net Profit', 'Broker', 'Score'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/20">
              {HISTORY.map(load => (
                <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                  <td className="px-5 py-4 text-dark-300 text-xs whitespace-nowrap">{load.date}</td>
                  <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{load.origin} → {load.dest}</td>
                  <td className="px-5 py-4 text-dark-200">{load.miles}</td>
                  <td className="px-5 py-4 text-white">${load.rate.toLocaleString()}</td>
                  <td className={`px-5 py-4 font-bold ${load.net > 0 ? 'text-brand-400' : 'text-red-400'}`}>
                    {load.net >= 0 ? '+' : ''}${load.net.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-dark-200 text-xs">{load.broker}</td>
                  <td className="px-5 py-4"><ScoreIcon score={load.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
