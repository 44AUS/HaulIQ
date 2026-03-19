import React, { useState, useEffect, useCallback } from 'react';
import { Package, Edit, Trash2, Eye, Users, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';

const STATUS_OPTS = ['all', 'active', 'filled', 'expired'];

export default function ManageLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchLoads = useCallback(() => {
    setLoading(true);
    loadsApi.posted()
      .then(res => {
        const adapted = adaptLoadList(res);
        // map 'removed' status to 'expired' for display
        setLoads(adapted.map(l => ({ ...l, status: l.status === 'removed' ? 'expired' : l.status })));
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleDelete = (load) => {
    loadsApi.delete(load._raw.id)
      .then(() => fetchLoads())
      .catch(err => alert(err.message));
  };

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={22} className="text-brand-400" />Manage Loads</h1>
          <p className="text-dark-300 text-sm mt-1">{loads.filter(l => l.status === 'active').length} active loads</p>
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
            {s} {s !== 'all' && `(${loads.filter(l => l.status === s).length})`}
          </button>
        ))}
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-dark-400">No loads found</td>
                  </tr>
                ) : filtered.map(load => (
                  <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{load.origin} → {load.dest}</td>
                    <td className="px-5 py-4 text-dark-300 whitespace-nowrap">{load.type}</td>
                    <td className="px-5 py-4 text-white font-semibold">${(load.rate || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-dark-300 text-xs whitespace-nowrap">{load.pickup}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-dark-200"><Eye size={12} />{load.viewCount || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-dark-200"><Users size={12} />—</span>
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
                        <button onClick={() => handleDelete(load)} className="p-1.5 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
      )}
    </div>
  );
}
