import React, { useState } from 'react';
import { Package, Edit, Trash2, Eye, Users, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LOADS = [
  { id: 'BL1', origin: 'Chicago, IL', dest: 'Atlanta, GA', rate: 2900, type: 'Dry Van', status: 'active', views: 48, bids: 12, pickup: '2026-03-20', delivery: '2026-03-21' },
  { id: 'BL2', origin: 'Dallas, TX',  dest: 'Houston, TX', rate: 950,  type: 'Reefer', status: 'active', views: 23, bids: 4, pickup: '2026-03-21', delivery: '2026-03-21' },
  { id: 'BL3', origin: 'Miami, FL',   dest: 'New York, NY', rate: 4100, type: 'Dry Van', status: 'filled', views: 91, bids: 29, pickup: '2026-03-19', delivery: '2026-03-21' },
  { id: 'BL4', origin: 'Seattle, WA', dest: 'Portland, OR', rate: 620, type: 'Flatbed', status: 'expired', views: 11, bids: 0, pickup: '2026-03-17', delivery: '2026-03-17' },
  { id: 'BL5', origin: 'Phoenix, AZ', dest: 'Los Angeles, CA', rate: 1400, type: 'Dry Van', status: 'active', views: 35, bids: 7, pickup: '2026-03-22', delivery: '2026-03-22' },
];

const STATUS_OPTS = ['all', 'active', 'filled', 'expired'];

export default function ManageLoads() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? LOADS : LOADS.filter(l => l.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={22} className="text-brand-400" />Manage Loads</h1>
          <p className="text-dark-300 text-sm mt-1">{LOADS.filter(l => l.status === 'active').length} active loads</p>
        </div>
        <Link to="/broker/post" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <PlusCircle size={16} /> Post New Load
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
              filter === s ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-dark-400/40 text-dark-300 hover:text-white'
            }`}>
            {s} {s !== 'all' && `(${LOADS.filter(l => l.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
              <tr>
                {['Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/20">
              {filtered.map(load => (
                <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{load.origin} → {load.dest}</td>
                  <td className="px-5 py-4 text-dark-300 whitespace-nowrap">{load.type}</td>
                  <td className="px-5 py-4 text-white font-semibold">${load.rate.toLocaleString()}</td>
                  <td className="px-5 py-4 text-dark-300 text-xs whitespace-nowrap">{load.pickup}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-dark-200"><Eye size={12} />{load.views}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-dark-200"><Users size={12} />{load.bids}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={load.status === 'active' ? 'badge-green' : load.status === 'filled' ? 'badge-blue' : 'badge-red'}>
                      {load.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {load.status === 'active' && (
                        <button className="p-1.5 text-dark-300 hover:text-white hover:bg-dark-600 rounded-lg transition-colors">
                          <Edit size={14} />
                        </button>
                      )}
                      <button className="p-1.5 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
