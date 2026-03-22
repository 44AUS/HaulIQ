import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, Truck, MapPin, Zap, Brain, ArrowRight, Users, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loadsApi, analyticsApi, networkApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
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
  const [hotLoads, setHotLoads] = useState([]);
  const [summary, setSummary] = useState(null);
  const [networkRequests, setNetworkRequests] = useState([]);

  const handleRespond = (id, accepted) => {
    networkApi.respond(id, accepted)
      .then(() => setNetworkRequests(prev => prev.filter(r => r.id !== id)))
      .catch(() => {});
  };

  useEffect(() => {
    loadsApi.list({ per_page: 3, sort_by: 'recent', hot_only: true })
      .then(res => setHotLoads(adaptLoadList(res)))
      .catch(() => {
        // fallback: fetch without hot filter
        loadsApi.list({ per_page: 3, sort_by: 'recent' })
          .then(res => setHotLoads(adaptLoadList(res)))
          .catch(() => setHotLoads([]));
      });

    analyticsApi.summary()
      .then(data => setSummary(data))
      .catch(() => setSummary(null));

    networkApi.requests()
      .then(data => setNetworkRequests(Array.isArray(data) ? data : []))
      .catch(() => setNetworkRequests([]));
  }, []);

  const weeklyData = (summary?.weekly_earnings || []).slice(-6);
  const chartData = weeklyData.map(w => ({ week: w.week_label, net: w.net }));

  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';

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
        <StatCard icon={DollarSign} label="Total Net" value={fmt(summary?.total_net)} sub="All time" color="brand" />
        <StatCard icon={TrendingUp} label="Avg Rate/Mile" value={summary?.avg_rate_per_mile ? `$${Number(summary.avg_rate_per_mile).toFixed(2)}` : '—'} sub="All time" color="blue" />
        <StatCard icon={Truck} label="Loads Completed" value={summary?.total_loads ?? '—'} sub="All time" color="yellow" />
        <StatCard icon={MapPin} label="Avg Deadhead" value={summary?.avg_deadhead_miles ? `${Math.round(summary.avg_deadhead_miles)} mi` : '—'} sub="Per load" color="brand" />
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
          {chartData.length > 0 ? (
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
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Net']}
                />
                <Area type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} fill="url(#netGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-dark-400 text-sm">Complete loads to see your earnings trend</p>
            </div>
          )}
        </div>

        {/* Brain insight card */}
        <div className="glass rounded-xl p-6 border border-brand-500/20 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-brand-400" />
            <h2 className="text-white font-semibold text-sm">Earnings Brain</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-dark-400 text-sm text-center">Insights load on the Brain page</p>
          </div>
          <Link to="/carrier/brain" className="btn-primary text-sm py-2 text-center mt-4 flex items-center justify-center gap-1">
            See all insights <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Network Requests */}
      {networkRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-400" />
            <h2 className="text-white font-semibold">Network Requests</h2>
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold px-2 py-0.5 rounded-full">{networkRequests.length}</span>
          </div>
          <div className="space-y-3">
            {networkRequests.map(req => (
              <div key={req.id} className="glass rounded-xl border border-dark-400/40 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white font-semibold text-sm">{req.name}</p>
                  {req.company && <p className="text-dark-400 text-xs">{req.company}</p>}
                  <p className="text-dark-500 text-xs mt-0.5">Wants to connect with you</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespond(req.id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 text-xs font-medium transition-colors">
                    <Check size={12} /> Accept
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors">
                    <X size={12} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {hotLoads.length === 0 ? (
          <div className="glass rounded-xl border border-dark-400/40 p-8 text-center">
            <p className="text-dark-400 text-sm">No hot loads right now — check back soon</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {hotLoads.map(load => <LoadCard key={load.id} load={load} />)}
          </div>
        )}
      </div>
    </div>
  );
}
