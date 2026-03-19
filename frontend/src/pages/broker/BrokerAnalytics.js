import React from 'react';
import { BarChart2, Eye, TrendingUp, Users, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CONVERSION_DATA = [
  { week: 'W1', views: 120, bids: 31, filled: 8 },
  { week: 'W2', views: 185, bids: 48, filled: 14 },
  { week: 'W3', views: 143, bids: 37, filled: 11 },
  { week: 'W4', views: 221, bids: 61, filled: 18 },
  { week: 'W5', views: 198, bids: 54, filled: 15 },
  { week: 'W6', views: 267, bids: 74, filled: 22 },
];

const TOP_CARRIERS = [
  { name: 'Rodriguez Trucking', loads: 8, rating: 5.0, avgBid: 2850 },
  { name: 'Wilson Transport',   loads: 6, rating: 4.8, avgBid: 2720 },
  { name: 'Park Logistics',     loads: 5, rating: 4.9, avgBid: 2900 },
  { name: 'Hart Freight',       loads: 4, rating: 4.7, avgBid: 2680 },
];

const ChartTooltipStyle = { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 } };

export default function BrokerAnalytics() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart2 size={22} className="text-brand-400" />Broker Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Performance metrics for your load board activity</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Eye,       label: 'Total Views',    value: '1,134', sub: 'Last 6 weeks', color: 'blue' },
          { icon: Users,     label: 'Total Bids',     value: '305',   sub: 'Last 6 weeks', color: 'yellow' },
          { icon: TrendingUp,label: 'Fill Rate',      value: '67%',   sub: '+36% vs before', color: 'brand' },
          { icon: Clock,     label: 'Avg Time-to-Fill', value: '4.2h', sub: 'Per load', color: 'brand' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
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
        <h2 className="text-white font-semibold mb-5">Views → Bids → Filled</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={CONVERSION_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...ChartTooltipStyle} />
            <Bar dataKey="views" name="Views" fill="#30363d" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bids"  name="Bids"  fill="#3b82f6" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            <Bar dataKey="filled" name="Filled" fill="#22c55e" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3 text-xs text-dark-300">
          {[['Views', '#30363d'], ['Bids', '#3b82f6'], ['Filled', '#22c55e']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* Top carriers */}
      <div>
        <h2 className="text-white font-semibold mb-4">Top Carrier Partners</h2>
        <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
                <tr>
                  {['Carrier', 'Loads Taken', 'Rating', 'Avg Bid'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-400/20">
                {TOP_CARRIERS.map(c => (
                  <tr key={c.name} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-medium">{c.name}</td>
                    <td className="px-5 py-4 text-dark-200">{c.loads}x</td>
                    <td className="px-5 py-4 text-yellow-400 font-semibold">⭐ {c.rating}</td>
                    <td className="px-5 py-4 text-white font-semibold">${c.avgBid.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
