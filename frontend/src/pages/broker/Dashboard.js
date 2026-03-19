import React from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, Eye, Users, PlusCircle, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MY_LOADS = [
  { id: 'BL1', origin: 'Chicago, IL', dest: 'Atlanta, GA', rate: 2900, type: 'Dry Van', status: 'active', views: 48, bids: 12, posted: '2 hr ago' },
  { id: 'BL2', origin: 'Dallas, TX',  dest: 'Houston, TX', rate: 950,  type: 'Reefer', status: 'active', views: 23, bids: 4, posted: '5 hr ago' },
  { id: 'BL3', origin: 'Miami, FL',   dest: 'New York, NY', rate: 4100, type: 'Dry Van', status: 'filled', views: 91, bids: 29, posted: '1 day ago' },
  { id: 'BL4', origin: 'Seattle, WA', dest: 'Portland, OR', rate: 620, type: 'Flatbed', status: 'expired', views: 11, bids: 0, posted: '3 day ago' },
];

const WEEKLY_VIEWS = [
  { day: 'Mon', views: 42 }, { day: 'Tue', views: 67 }, { day: 'Wed', views: 55 },
  { day: 'Thu', views: 88 }, { day: 'Fri', views: 103 }, { day: 'Sat', views: 71 }, { day: 'Sun', views: 39 },
];

const StatusBadge = ({ status }) => {
  if (status === 'active')  return <span className="badge-green">Active</span>;
  if (status === 'filled')  return <span className="badge-blue">Filled</span>;
  return <span className="badge-red">Expired</span>;
};

export default function BrokerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-dark-300 text-sm mt-1">Your freight brokerage performance overview</p>
        </div>
        <Link to="/broker/post" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <PlusCircle size={16} /> Post a Load
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Active Loads', value: MY_LOADS.filter(l => l.status === 'active').length, color: 'brand' },
          { icon: Eye, label: 'Total Views', value: MY_LOADS.reduce((s, l) => s + l.views, 0), color: 'blue' },
          { icon: Users, label: 'Total Bids', value: MY_LOADS.reduce((s, l) => s + l.bids, 0), color: 'yellow' },
          { icon: TrendingUp, label: 'Fill Rate', value: '75%', color: 'brand' },
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

      {/* Chart + rating */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-xl p-6 border border-dark-400/40">
          <h2 className="text-white font-semibold mb-5">Load Views This Week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_VIEWS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="views" fill="#22c55e" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-6 border border-dark-400/40 space-y-4">
          <h2 className="text-white font-semibold text-sm">Your Broker Rating</h2>
          <div className="text-center py-4">
            <div className="text-5xl font-black text-white mb-1">{user?.name === 'Sarah Chen' ? '4.9' : '4.5'}</div>
            <div className="flex justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
            </div>
            <p className="text-dark-400 text-xs">Based on 178 carrier reviews</p>
          </div>
          <div className="space-y-2">
            {[['Payment Speed', 'Quick-Pay'], ['Response Rate', '98%'], ['Load Accuracy', '97%']].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-dark-300">{k}</span>
                <span className="text-brand-400 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent loads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">My Recent Loads</h2>
          <Link to="/broker/loads" className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1">
            Manage all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
                <tr>
                  {['Route', 'Type', 'Rate', 'Views', 'Bids', 'Status', 'Posted'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-400/20">
                {MY_LOADS.map(load => (
                  <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{load.origin} → {load.dest}</td>
                    <td className="px-5 py-4 text-dark-300">{load.type}</td>
                    <td className="px-5 py-4 text-white font-semibold">${load.rate.toLocaleString()}</td>
                    <td className="px-5 py-4 text-dark-200">{load.views}</td>
                    <td className="px-5 py-4 text-dark-200">{load.bids}</td>
                    <td className="px-5 py-4"><StatusBadge status={load.status} /></td>
                    <td className="px-5 py-4 text-dark-400 text-xs">{load.posted}</td>
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
