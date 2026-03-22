import { useState, useEffect } from 'react';
import { BarChart2, Eye, TrendingUp, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsApi } from '../../services/api';

const ChartTooltipStyle = { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 } };

export default function BrokerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.broker()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart2 size={22} className="text-brand-400" />Broker Analytics</h1>
          <p className="text-dark-300 text-sm mt-1">Performance metrics for your load board activity</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="stat-card animate-pulse"><div className="w-9 h-9 bg-dark-600 rounded-lg" /><div className="space-y-2"><div className="h-3 bg-dark-600 rounded w-20" /><div className="h-7 bg-dark-600 rounded w-16" /></div></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart2 size={22} className="text-brand-400" />Broker Analytics</h1>
        </div>
        <div className="glass rounded-xl p-6 border border-red-500/30 text-red-400">{error}</div>
      </div>
    );
  }

  const fillRate = data.fill_rate ?? 0;
  const avgTime = data.avg_time_to_fill_hours != null ? `${data.avg_time_to_fill_hours}h` : '—';

  const kpis = [
    { icon: Eye,        label: 'Total Views',      value: (data.total_views || 0).toLocaleString(), sub: 'All loads', color: 'blue' },
    { icon: Users,      label: 'Total Bids',        value: (data.total_bids  || 0).toLocaleString(), sub: 'All loads', color: 'yellow' },
    { icon: TrendingUp, label: 'Fill Rate',          value: `${fillRate}%`,                           sub: 'Loads filled / posted', color: 'brand' },
    { icon: Clock,      label: 'Avg Time-to-Fill',   value: avgTime,                                  sub: 'From post to approval', color: 'brand' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart2 size={22} className="text-brand-400" />Broker Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Performance metrics for your load board activity</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color === 'brand' ? 'bg-brand-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-yellow-500/10'}`}>
              <Icon size={18} className={color === 'brand' ? 'text-brand-400' : color === 'blue' ? 'text-blue-400' : 'text-yellow-400'} />
            </div>
            <div>
              <p className="text-dark-300 text-xs">{label}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
              <p className="text-dark-400 text-xs">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion funnel chart */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <h2 className="text-white font-semibold mb-5">Views → Bids → Filled (Last 6 Weeks)</h2>
        {data.weekly && data.weekly.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...ChartTooltipStyle} />
                <Bar dataKey="views"  name="Views"  fill="#30363d" radius={[4,4,0,0]} />
                <Bar dataKey="bids"   name="Bids"   fill="#3b82f6" fillOpacity={0.8} radius={[4,4,0,0]} />
                <Bar dataKey="filled" name="Filled" fill="#22c55e" fillOpacity={0.9} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3 text-xs text-dark-300">
              {[['Views', '#30363d'], ['Bids', '#3b82f6'], ['Filled', '#22c55e']].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: c }} />{l}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-dark-400 text-sm py-8 text-center">No load data yet. Post loads to see weekly trends.</p>
        )}
      </div>

      {/* Top carriers */}
      <div>
        <h2 className="text-white font-semibold mb-4">Top Carrier Partners</h2>
        <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
          {data.top_carriers && data.top_carriers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
                  <tr>
                    {['Carrier', 'MC #', 'Loads Taken'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-400/20">
                  {data.top_carriers.map((c, i) => (
                    <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                      <td className="px-5 py-4 text-white font-medium">{c.name}</td>
                      <td className="px-5 py-4 text-dark-200">{c.mc_number || '—'}</td>
                      <td className="px-5 py-4 text-dark-200">{c.loads}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-dark-400 text-sm px-5 py-8 text-center">No completed bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
