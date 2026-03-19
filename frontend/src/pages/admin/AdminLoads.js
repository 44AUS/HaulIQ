import React, { useState } from 'react';
import { Package, Check, X, Flag, Search } from 'lucide-react';
import { LOADS } from '../../data/sampleData';

export default function AdminLoads() {
  const [search, setSearch] = useState('');
  const filtered = LOADS.filter(l => !search || l.origin.toLowerCase().includes(search.toLowerCase()) || l.dest.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={22} className="text-brand-400" />Load Moderation</h1>
        <p className="text-dark-300 text-sm mt-1">Review and moderate loads on the platform</p>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
        <input className="input pl-9 text-sm" placeholder="Search loads..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Flagged loads alert */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
        <Flag size={16} className="text-yellow-400 flex-shrink-0" />
        <p className="text-yellow-300 text-sm">3 loads have been flagged by drivers for suspicious rates or broker issues.</p>
        <button className="ml-auto text-yellow-400 text-xs hover:text-yellow-300 whitespace-nowrap">Review flagged →</button>
      </div>

      <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50 text-dark-300 text-xs uppercase tracking-wider">
              <tr>
                {['Load ID', 'Route', 'Type', 'Rate', 'Broker', 'Profit Score', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/20">
              {filtered.map(load => (
                <tr key={load.id} className="hover:bg-dark-700/20 transition-colors">
                  <td className="px-5 py-4 text-dark-400 text-xs font-mono">{load.id}</td>
                  <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{load.origin} → {load.dest}</td>
                  <td className="px-5 py-4 text-dark-300">{load.type}</td>
                  <td className="px-5 py-4 text-white font-semibold">${load.rate.toLocaleString()}</td>
                  <td className="px-5 py-4 text-dark-200 text-xs whitespace-nowrap">{load.broker.name}</td>
                  <td className="px-5 py-4">
                    <span className={load.profitScore === 'green' ? 'badge-green' : load.profitScore === 'yellow' ? 'badge-yellow' : 'badge-red'}>
                      {load.profitScore}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" title="Approve">
                        <Check size={14} />
                      </button>
                      <button className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove">
                        <X size={14} />
                      </button>
                      <button className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Flag">
                        <Flag size={14} />
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
