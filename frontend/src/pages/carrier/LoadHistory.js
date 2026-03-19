import React, { useState, useEffect } from 'react';
import { History, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { adaptHistory } from '../../services/adapters';

const ScoreIcon = ({ score }) => {
  if (score === 'green') return <TrendingUp size={14} className="text-brand-400" />;
  if (score === 'yellow') return <Minus size={14} className="text-yellow-400" />;
  return <TrendingDown size={14} className="text-red-400" />;
};

export default function LoadHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.history()
      .then(data => setHistory(data.map(adaptHistory)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalNet = history.reduce((s, l) => s + (l.net || 0), 0);
  const totalGross = history.reduce((s, l) => s + (l.rate || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><History size={22} className="text-brand-400" />Load History</h1>
        <p className="text-dark-300 text-sm mt-1">Your completed loads</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Gross', value: `$${totalGross.toLocaleString()}` },
              { label: 'Total Net', value: `$${totalNet.toLocaleString()}`, highlight: true },
              { label: 'Loads Completed', value: history.length },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="stat-card">
                <p className="text-dark-300 text-xs">{label}</p>
                <p className={`text-2xl font-bold ${highlight ? 'text-brand-400' : 'text-white'}`}>{value}</p>
              </div>
            ))}
          </div>

          {history.length === 0 ? (
            <div className="glass rounded-xl border border-dark-400/40 py-20 text-center">
              <History size={36} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No completed loads yet.</p>
            </div>
          ) : (
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
                    {history.map(load => (
                      <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                        <td className="px-5 py-4 text-dark-300 text-xs whitespace-nowrap">{load.date}</td>
                        <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{load.origin} → {load.dest}</td>
                        <td className="px-5 py-4 text-dark-200">{load.miles}</td>
                        <td className="px-5 py-4 text-white">${(load.rate || 0).toLocaleString()}</td>
                        <td className={`px-5 py-4 font-bold ${(load.net || 0) > 0 ? 'text-brand-400' : 'text-red-400'}`}>
                          {(load.net || 0) >= 0 ? '+' : ''}${(load.net || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-dark-200 text-xs">{load.broker}</td>
                        <td className="px-5 py-4"><ScoreIcon score={load.score} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
