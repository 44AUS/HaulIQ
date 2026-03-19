import React, { useState, useEffect } from 'react';
import { Search, Zap, X } from 'lucide-react';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';

const TYPES = ['All Types', 'Dry Van', 'Reefer', 'Flatbed'];
const SORT_OPTIONS = [
  { value: 'profit', label: 'Highest Net Profit' },
  { value: 'rate', label: 'Highest Rate/Mile' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'miles', label: 'Most Miles' },
];

export default function LoadBoard() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All Types');
  const [sort, setSort] = useState('profit');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [hotOnly, setHotOnly] = useState(false);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (type !== 'All Types') params.load_type = { 'Dry Van': 'dry_van', 'Reefer': 'reefer', 'Flatbed': 'flatbed' }[type];
    if (scoreFilter !== 'all') params.profit_score = scoreFilter;
    if (hotOnly) params.hot_only = true;
    params.sort_by = { profit: 'profit', rate: 'rate_per_mile', recent: 'recent', miles: 'miles' }[sort] || 'profit';

    loadsApi.list(params)
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setLoading(false));
  }, [search, type, sort, scoreFilter, hotOnly]);

  const counts = {
    green:  loads.filter(l => l.profitScore === 'green').length,
    yellow: loads.filter(l => l.profitScore === 'yellow').length,
    red:    loads.filter(l => l.profitScore === 'red').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Load Board</h1>
        <p className="text-dark-300 text-sm mt-1">{loads.length} loads available · Sorted by profitability</p>
      </div>

      {/* Profit score quick-filter pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: 'all', label: `All Loads (${loads.length})`, cls: 'border-dark-400/50 text-dark-200 hover:text-white hover:border-dark-300', active: 'border-white text-white bg-dark-600' },
          { key: 'green', label: `✅ High Profit (${counts.green})`, cls: 'border-brand-500/20 text-brand-400 hover:border-brand-500/40', active: 'border-brand-500 bg-brand-500/10 text-brand-400' },
          { key: 'yellow', label: `⚠️ Marginal (${counts.yellow})`, cls: 'border-yellow-500/20 text-yellow-400', active: 'border-yellow-500 bg-yellow-500/10 text-yellow-400' },
          { key: 'red', label: `❌ Loss Risk (${counts.red})`, cls: 'border-red-500/20 text-red-400', active: 'border-red-500 bg-red-500/10 text-red-400' },
        ].map(({ key, label, cls, active }) => (
          <button key={key} onClick={() => setScoreFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${scoreFilter === key ? active : cls}`}>
            {label}
          </button>
        ))}
        <button onClick={() => setHotOnly(!hotOnly)}
          className={`px-4 py-2 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${hotOnly ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-red-500/20 text-red-400 hover:border-red-500/40'}`}>
          <Zap size={11} /> Hot Only
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
          <input
            className="input pl-9"
            placeholder="Search origin, destination, commodity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select value={type} onChange={e => setType(e.target.value)} className="input py-0 w-auto bg-dark-700 cursor-pointer text-sm">
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="input py-0 w-auto bg-dark-700 cursor-pointer text-sm">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : apiError ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400">{apiError}</p>
        </div>
      ) : loads.length === 0 ? (
        <div className="text-center py-20 glass rounded-xl">
          <p className="text-dark-300 text-lg">No loads match your filters</p>
          <button onClick={() => { setSearch(''); setType('All Types'); setScoreFilter('all'); setHotOnly(false); }}
            className="text-brand-400 text-sm mt-2 hover:text-brand-300">Clear filters</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loads.map(load => <LoadCard key={load.id} load={load} />)}
        </div>
      )}
    </div>
  );
}
