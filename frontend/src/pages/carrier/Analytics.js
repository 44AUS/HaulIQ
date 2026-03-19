import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, MapPin, Truck } from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ChartTooltipStyle = { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 } };

export default function CarrierAnalytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.summary()
      .then(data => { setSummary(data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const weeklyData = summary?.weekly_earnings || [];
  const laneData   = summary?.lane_stats || [];

  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';
  const fmtMi = (n) => n != null ? Number(n).toLocaleString() : '—';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Your performance data</p>
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
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: 'Total Gross',   value: fmt(summary?.total_gross),          color: 'brand' },
              { icon: TrendingUp, label: 'Total Net',     value: fmt(summary?.total_net),             color: 'brand' },
              { icon: Truck,      label: 'Total Miles',   value: fmtMi(summary?.total_miles),         color: 'blue' },
              { icon: MapPin,     label: 'Avg Net/Mile',  value: summary?.avg_net_per_mile ? `$${Number(summary.avg_net_per_mile).toFixed(2)}` : '—', color: 'yellow' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color === 'brand' ? 'bg-brand-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-yellow-500/10'}`}>
                  <Icon size={18} className={color === 'brand' ? 'text-brand-400' : color === 'blue' ? 'text-blue-400' : 'text-yellow-400'} />
                </div>
                <div>
                  <p className="text-dark-300 text-xs">{label}</p>
                  <p className="text-white text-2xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Net earnings chart */}
          {weeklyData.length > 0 && (
            <div className="glass rounded-xl p-6 border border-dark-400/40">
              <h2 className="text-white font-semibold mb-5">Net Earnings by Week</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="areaGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="week_label" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n === 'gross' ? 'Gross' : 'Net']} />
                  <Area type="monotone" dataKey="gross" stroke="#22c55e" strokeWidth={2} fill="url(#areaGross)" />
                  <Area type="monotone" dataKey="net"   stroke="#4ade80" strokeWidth={2} fill="url(#areaNet)" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-3 text-xs text-dark-300">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-500" />Gross</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-400" />Net</div>
              </div>
            </div>
          )}

          {/* Miles per week */}
          {weeklyData.length > 0 && (
            <div className="glass rounded-xl p-6 border border-dark-400/40">
              <h2 className="text-white font-semibold mb-5">Miles Driven</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                  <XAxis dataKey="week_label" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...ChartTooltipStyle} formatter={(v) => [Number(v).toLocaleString() + ' mi', 'Miles']} />
                  <Bar dataKey="miles" fill="#22c55e" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lane table */}
          {laneData.length > 0 && (
            <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
              <div className="p-5 border-b border-dark-400/40">
                <h2 className="text-white font-semibold">Top Lane Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
                    <tr>
                      {['Lane', 'Runs', 'Avg Net Profit', 'Avg Rate/Mile', 'Verdict'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-400/20">
                    {laneData.map((lane, i) => (
                      <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                        <td className="px-5 py-4 text-white font-medium">{lane.origin} → {lane.destination}</td>
                        <td className="px-5 py-4 text-dark-200">{lane.run_count}x</td>
                        <td className="px-5 py-4 text-white font-semibold">{fmt(lane.avg_net_profit)}</td>
                        <td className="px-5 py-4 text-dark-200">${Number(lane.avg_rate_per_mile || 0).toFixed(2)}/mi</td>
                        <td className="px-5 py-4">
                          <span className={(lane.avg_net_profit || 0) > 1000 ? 'badge-green' : (lane.avg_net_profit || 0) > 0 ? 'badge-yellow' : 'badge-red'}>
                            {(lane.avg_net_profit || 0) > 1000 ? '✅ Run it' : (lane.avg_net_profit || 0) > 0 ? '⚠️ Okay' : '❌ Avoid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {weeklyData.length === 0 && laneData.length === 0 && (
            <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
              <TrendingUp size={32} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No analytics data yet. Complete loads to see your performance.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
