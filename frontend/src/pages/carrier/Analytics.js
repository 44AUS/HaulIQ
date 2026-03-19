import React from 'react';
import { TrendingUp, DollarSign, MapPin, Truck } from 'lucide-react';
import { WEEKLY_EARNINGS, LANE_PERFORMANCE } from '../../data/sampleData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ChartTooltipStyle = { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 } };

export default function CarrierAnalytics() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Last 10 weeks of performance data</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Gross', value: '$51,200', change: '+18%', color: 'brand' },
          { icon: TrendingUp, label: 'Total Net',   value: '$34,050', change: '+22%', color: 'brand' },
          { icon: Truck,      label: 'Total Miles', value: '17,410',  change: '+12%', color: 'blue' },
          { icon: MapPin,     label: 'Avg Net/Mile',value: '$1.96',   change: '+8%',  color: 'yellow' },
        ].map(({ icon: Icon, label, value, change, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color === 'brand' ? 'bg-brand-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-yellow-500/10'}`}>
              <Icon size={18} className={color === 'brand' ? 'text-brand-400' : color === 'blue' ? 'text-blue-400' : 'text-yellow-400'} />
            </div>
            <div>
              <p className="text-dark-300 text-xs">{label}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
              <span className="badge-green text-xs">{change} vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Net earnings chart */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <h2 className="text-white font-semibold mb-5">Net Earnings — Last 10 Weeks</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={WEEKLY_EARNINGS}>
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
            <XAxis dataKey="week" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip {...ChartTooltipStyle} formatter={(v, n) => [`$${v.toLocaleString()}`, n === 'gross' ? 'Gross' : 'Net']} />
            <Area type="monotone" dataKey="gross" stroke="#22c55e" strokeWidth={2} fill="url(#areaGross)" />
            <Area type="monotone" dataKey="net"   stroke="#4ade80" strokeWidth={2} fill="url(#areaNet)" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3 text-xs text-dark-300">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-500" />Gross</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-400 border-dashed" style={{borderBottom:'2px dashed #4ade80', height:0}} />Net</div>
        </div>
      </div>

      {/* Miles per week */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <h2 className="text-white font-semibold mb-5">Miles Driven</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={WEEKLY_EARNINGS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...ChartTooltipStyle} formatter={(v) => [v.toLocaleString() + ' mi', 'Miles']} />
            <Bar dataKey="miles" fill="#22c55e" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lane table */}
      <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
        <div className="p-5 border-b border-dark-400/40">
          <h2 className="text-white font-semibold">Top Lane Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
              <tr>
                {['Lane', 'Runs', 'Avg Net Profit', 'Profitability', 'Verdict'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/20">
              {LANE_PERFORMANCE.map(lane => (
                <tr key={lane.lane} className="hover:bg-dark-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{lane.lane}</td>
                  <td className="px-5 py-4 text-dark-200">{lane.runs}x</td>
                  <td className="px-5 py-4 text-white font-semibold">${lane.avgNet.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-dark-600 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${lane.profitability >= 80 ? 'bg-brand-500' : lane.profitability >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${lane.profitability}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${lane.profitability >= 80 ? 'text-brand-400' : lane.profitability >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {lane.profitability}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={lane.profitability >= 80 ? 'badge-green' : lane.profitability >= 60 ? 'badge-yellow' : 'badge-red'}>
                      {lane.profitability >= 80 ? '✅ Run it' : lane.profitability >= 60 ? '⚠️ Okay' : '❌ Avoid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
