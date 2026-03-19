import React from 'react';
import { DollarSign, Users, Package, TrendingUp, ArrowUpRight, Shield } from 'lucide-react';
import { ADMIN_STATS } from '../../data/sampleData';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = { Basic: '#30363d', Pro: '#22c55e', Elite: '#a855f7' };
const PIE_COLORS = ['#30363d', '#22c55e', '#a855f7'];

const ChartTooltipStyle = { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 } };

export default function AdminOverview() {
  const pieData = [
    ...ADMIN_STATS.carrierDist.map(d => ({ name: `C-${d.plan}`, value: d.count })),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-brand-400" />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-dark-300 text-sm">Platform overview — HaulIQ Operations</p>
        </div>
        <span className="badge-green text-sm px-3 py-1.5">All systems operational</span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Monthly MRR', value: `$${(ADMIN_STATS.mrr/1000).toFixed(1)}K`, change: `+${ADMIN_STATS.mrrGrowth}%`, color: 'brand' },
          { icon: Users,      label: 'Active Subscribers', value: ADMIN_STATS.activeSubscribers.toLocaleString(), change: `+${ADMIN_STATS.subGrowth}%`, color: 'blue' },
          { icon: Package,    label: 'Total Loads Posted', value: ADMIN_STATS.totalLoads.toLocaleString(), change: '+5.2%', color: 'yellow' },
          { icon: TrendingUp, label: 'Total Users', value: ADMIN_STATS.totalUsers.toLocaleString(), change: '+14.1%', color: 'brand' },
        ].map(({ icon: Icon, label, value, change, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color === 'brand' ? 'bg-brand-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-yellow-500/10'}`}>
                <Icon size={18} className={color === 'brand' ? 'text-brand-400' : color === 'blue' ? 'text-blue-400' : 'text-yellow-400'} />
              </div>
              <div className="flex items-center gap-0.5 text-brand-400 text-xs font-semibold">
                <ArrowUpRight size={12} />{change}
              </div>
            </div>
            <div>
              <p className="text-dark-300 text-xs">{label}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MRR chart + plan distribution */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-xl p-6 border border-dark-400/40">
          <h2 className="text-white font-semibold mb-5">MRR Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ADMIN_STATS.revenueByMonth}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="month" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip {...ChartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2.5} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="glass rounded-xl p-6 border border-dark-400/40">
          <h2 className="text-white font-semibold text-sm mb-4">Carrier Plan Distribution</h2>
          <div className="space-y-3">
            {ADMIN_STATS.carrierDist.map((d, i) => (
              <div key={d.plan}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-dark-200">{d.plan}</span>
                  <span className="text-white font-semibold">{d.count} ({d.pct}%)</span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, background: PIE_COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-400/40 mt-4 pt-4">
            <h2 className="text-white font-semibold text-sm mb-3">Broker Plan Distribution</h2>
            <div className="space-y-3">
              {ADMIN_STATS.brokerDist.map((d, i) => (
                <div key={d.plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dark-200">{d.plan}</span>
                    <span className="text-white font-semibold">{d.count} ({d.pct}%)</span>
                  </div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: PIE_COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick alerts */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'New Users Today', value: '14', icon: '🆕', color: 'green' },
          { label: 'Loads Pending Review', value: '7', icon: '📋', color: 'yellow' },
          { label: 'Support Tickets', value: '3', icon: '🎫', color: 'blue' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`glass rounded-xl p-4 border flex items-center gap-3 ${
            color === 'green' ? 'border-brand-500/20' : color === 'yellow' ? 'border-yellow-500/20' : 'border-blue-500/20'
          }`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-dark-300 text-xs">{label}</p>
              <p className="text-white text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
