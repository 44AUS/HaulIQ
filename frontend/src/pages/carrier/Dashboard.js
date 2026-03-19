import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, Truck, MapPin, Zap, Brain, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LOADS, BRAIN_INSIGHTS, WEEKLY_EARNINGS } from '../../data/sampleData';
import LoadCard from '../../components/carrier/LoadCard';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand', trend }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        color === 'brand'  ? 'bg-brand-500/10'  :
        color === 'blue'   ? 'bg-blue-500/10'   :
        color === 'yellow' ? 'bg-yellow-500/10' : 'bg-purple-500/10'
      }`}>
        <Icon size={18} className={
          color === 'brand'  ? 'text-brand-400'  :
          color === 'blue'   ? 'text-blue-400'   :
          color === 'yellow' ? 'text-yellow-400' : 'text-purple-400'
        } />
      </div>
      {trend && <span className="badge-green text-xs">{trend}</span>}
    </div>
    <div>
      <p className="text-dark-200 text-xs font-medium">{label}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
      {sub && <p className="text-dark-300 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function CarrierDashboard() {
  const { user } = useAuth();
  const hotLoads = LOADS.filter(l => l.hot).slice(0, 3);
  const insight = BRAIN_INSIGHTS[0];
  const chartData = WEEKLY_EARNINGS.slice(-6);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-dark-300 text-sm mt-1">Here's your profit snapshot for today</p>
        </div>
        <Link to="/carrier/loads" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Truck size={16} /> Browse Loads
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="This Week" value="$4,200" sub="Net profit" color="brand" trend="+12%" />
        <StatCard icon={TrendingUp} label="Avg Rate/Mile" value="$3.28" sub="Last 30 days" color="blue" />
        <StatCard icon={Truck} label="Loads Completed" value="12" sub="This month" color="yellow" />
        <StatCard icon={MapPin} label="Avg Deadhead" value="34 mi" sub="Below avg (67mi)" color="brand" trend="Good" />
      </div>

      {/* Earnings chart + Brain insight */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-xl p-6 border border-dark-400/40">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Earnings Trend</h2>
            <Link to="/carrier/analytics" className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1">
              Full analytics <ArrowRight size={12} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: '#6e7681', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${v.toLocaleString()}`, 'Net']}
              />
              <Area type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} fill="url(#netGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Brain insight card */}
        <div className="glass rounded-xl p-6 border border-brand-500/20 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-brand-400" />
            <h2 className="text-white font-semibold text-sm">Earnings Brain</h2>
            <span className="badge-green text-xs">New</span>
          </div>
          <div className="flex-1 space-y-4">
            <div className="text-3xl">{insight.icon}</div>
            <div>
              <p className="text-white font-semibold text-sm">{insight.title}</p>
              <p className="text-dark-200 text-xs mt-1 leading-relaxed">{insight.body}</p>
            </div>
            <span className="badge-green text-xs inline-block">{insight.tag}</span>
          </div>
          <Link to="/carrier/brain" className="btn-primary text-sm py-2 text-center mt-4 flex items-center justify-center gap-1">
            See all insights <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Hot Loads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-red-400" />
            <h2 className="text-white font-semibold">🔥 Hot Loads Right Now</h2>
          </div>
          <Link to="/carrier/loads" className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {hotLoads.map(load => <LoadCard key={load.id} load={load} />)}
        </div>
      </div>
    </div>
  );
}
