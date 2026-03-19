import React, { useState } from 'react';
import { Users, Search, UserCheck, UserX, MoreHorizontal, Shield, X } from 'lucide-react';
import { MOCK_USERS_LIST } from '../../data/sampleData';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = MOCK_USERS_LIST.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={22} className="text-brand-400" />User Management</h1>
          <p className="text-dark-300 text-sm mt-1">{MOCK_USERS_LIST.length} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
          <input className="input pl-9 text-sm" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'carrier', 'broker', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${roleFilter === r ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-dark-400/40 text-dark-300 hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
              <tr>
                {['User', 'Role', 'Plan', 'Status', 'Joined', 'MRR', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/20">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-dark-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-500/10 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-dark-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`capitalize text-xs font-medium ${u.role === 'carrier' ? 'text-brand-400' : u.role === 'broker' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={u.plan === 'elite' ? 'badge-blue' : u.plan === 'pro' ? 'badge-green' : 'text-dark-400 text-xs capitalize'}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={u.status === 'active' ? 'badge-green' : 'badge-red'}>{u.status}</span>
                  </td>
                  <td className="px-5 py-4 text-dark-300 text-xs whitespace-nowrap">{u.joined}</td>
                  <td className="px-5 py-4 text-white font-semibold">{u.revenue > 0 ? `$${u.revenue}/mo` : <span className="text-dark-500">Free</span>}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {u.status === 'active' ? (
                        <button className="p-1.5 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Suspend">
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button className="p-1.5 text-dark-300 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" title="Activate">
                          <UserCheck size={14} />
                        </button>
                      )}
                      <button onClick={() => setSelectedUser(u)}
                        className="p-1.5 text-dark-300 hover:text-white hover:bg-dark-600 rounded-lg transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass rounded-2xl border border-dark-400/60 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-dark-300 hover:text-white p-1 rounded-lg hover:bg-dark-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-dark-400/40">
                <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedUser.name}</p>
                  <p className="text-dark-300 text-sm">{selectedUser.email}</p>
                </div>
              </div>
              {[
                ['Role', selectedUser.role],
                ['Plan', selectedUser.plan],
                ['Status', selectedUser.status],
                ['Member Since', selectedUser.joined],
                ['Monthly Revenue', selectedUser.revenue > 0 ? `$${selectedUser.revenue}/mo` : 'Free'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-dark-300">{k}</span>
                  <span className="text-white font-medium capitalize">{v}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-5 pt-4 border-t border-dark-400/40">
                <button className="flex-1 btn-secondary text-sm py-2">Edit Plan</button>
                <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium px-4 py-2 rounded-lg text-sm transition-colors">
                  Suspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
