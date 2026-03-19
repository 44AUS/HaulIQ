import React from 'react';
import { DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ADMIN_STATS } from '../../data/sampleData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PLAN_REVENUE = [
  { plan: 'Carrier Basic', subs: 680, price: 0, mrr: 0 },
  { plan: 'Carrier Pro', subs: 420, price: 49, mrr: 20580 },
  { plan: 'Carrier Elite', subs: 184, price: 99, mrr: 18216 },
  { plan: 'Broker Basic', subs: 420, price: 0, mrr: 0 },
  { plan: 'Broker Pro', subs: 248, price: 79, mrr: 19592 },
  { plan: 'Broker Elite', subs: 136, price: 149, mrr: 20264 },
];

const ChartTooltipStyle = { contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 } };

export default function AdminRevenue() {
  const totalMRR = PLAN_REVENUE.reduce((s, p) => s + p.mrr, 0);
  const arr = totalMRR * 12;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign size={22} className="text-brand-400" />Revenue Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Subscription revenue breakdown and growth trends</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: `$${(totalMRR/1000).toFixed(1)}K`, change: '+12.4%' },
          { label: 'ARR (projected)', value: `$${(arr/1000).toFixed(0)}K`, change: '+12.4%' },
          { label: 'Avg Revenue/User', value: '$37.5', change: '+4.2%' },
          { label: 'LTV (est.)', value: '$2,250', change: '+8.1%' },
        ].map(({ label, value, change }) => (
          <div key={label} className="stat-card">
            <div className="flex justify-between items-start">
              <p className="text-dark-300 text-xs">{label}</p>
              <span className="flex items-center gap-0.5 text-brand-400 text-xs font-semibold"><ArrowUpRight size={10} />{change}</span>
            </div>
            <p className="text-white text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* MRR trend */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <h2 className="text-white font-semibold mb-5">MRR Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={ADMIN_STATS.revenueByMonth}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="month" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip {...ChartTooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, 'MRR']} />
            <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by plan table */}
      <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
        <div className="p-5 border-b border-dark-400/40">
          <h2 className="text-white font-semibold">Revenue by Plan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
              <tr>
                {['Plan', 'Subscribers', 'Price', 'MRR', 'MRR Share'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/20">
              {PLAN_REVENUE.map(p => (
                <tr key={p.plan} className="hover:bg-dark-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{p.plan}</td>
                  <td className="px-5 py-4 text-dark-200">{p.subs.toLocaleString()}</td>
                  <td className="px-5 py-4 text-dark-200">{p.price === 0 ? <span className="text-dark-500">Free</span> : `$${p.price}/mo`}</td>
                  <td className="px-5 py-4 text-white font-bold">{p.mrr === 0 ? <span className="text-dark-500">$0</span> : `$${p.mrr.toLocaleString()}`}</td>
                  <td className="px-5 py-4">
                    {p.mrr > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-dark-600 rounded-full h-1.5">
                          <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${(p.mrr / totalMRR * 100).toFixed(0)}%` }} />
                        </div>
                        <span className="text-dark-300 text-xs">{(p.mrr / totalMRR * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-dark-700/40 border-t border-dark-400/40 font-bold">
                <td className="px-5 py-4 text-white">Total</td>
                <td className="px-5 py-4 text-white">{PLAN_REVENUE.reduce((s, p) => s + p.subs, 0).toLocaleString()}</td>
                <td className="px-5 py-4 text-dark-400">—</td>
                <td className="px-5 py-4 text-brand-400 text-lg">${totalMRR.toLocaleString()}</td>
                <td className="px-5 py-4 text-dark-400">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
