import React, { useEffect, useState } from 'react';
import { Users, Trash2, RefreshCw, Truck, Briefcase } from 'lucide-react';
import { waitlistApi } from '../../services/api';

function RoleBadge({ role }) {
  if (role === 'carrier') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400">
      <Truck size={11} /> Carrier
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400">
      <Briefcase size={11} /> Broker
    </span>
  );
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | carrier | broker
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await waitlistApi.list();
      setEntries(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry from the waitlist?')) return;
    setDeleting(id);
    try {
      await waitlistApi.remove(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.role === filter);
  const carrierCount = entries.filter(e => e.role === 'carrier').length;
  const brokerCount = entries.filter(e => e.role === 'broker').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-brand-400" />
            <h1 className="text-2xl font-bold text-white">Waitlist</h1>
          </div>
          <p className="text-dark-300 text-sm">People waiting for early access to HaulIQ</p>
        </div>
        <button
          onClick={load}
          className="btn-secondary flex items-center gap-2 text-sm"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: entries.length, color: 'text-white' },
          { label: 'Carriers', value: carrierCount, color: 'text-brand-400' },
          { label: 'Brokers', value: brokerCount, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-dark-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'carrier', 'broker'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            {f === 'all' ? `All (${entries.length})` : f === 'carrier' ? `Carriers (${carrierCount})` : `Brokers (${brokerCount})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-dark-400">
            {filter === 'all' ? 'No waitlist entries yet.' : `No ${filter}s on the waitlist yet.`}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-5 py-3 text-dark-400 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-dark-400 font-medium">Email</th>
                <th className="text-left px-5 py-3 text-dark-400 font-medium">Role</th>
                <th className="text-left px-5 py-3 text-dark-400 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-dark-800 hover:bg-dark-800/50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-5 py-3 text-white font-medium">
                    {entry.name || <span className="text-dark-500 italic">—</span>}
                  </td>
                  <td className="px-5 py-3 text-dark-300">{entry.email}</td>
                  <td className="px-5 py-3"><RoleBadge role={entry.role} /></td>
                  <td className="px-5 py-3 text-dark-400">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="p-1.5 rounded hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Remove from waitlist"
                    >
                      {deleting === entry.id
                        ? <RefreshCw size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
