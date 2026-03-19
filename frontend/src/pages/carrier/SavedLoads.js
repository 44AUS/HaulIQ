import React, { useState, useEffect } from 'react';
import { BookmarkCheck } from 'lucide-react';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';

export default function SavedLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadsApi.savedList()
      .then(res => setLoads(adaptLoadList(res)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookmarkCheck size={22} className="text-brand-400" />Saved Loads</h1>
        <p className="text-dark-300 text-sm mt-1">{loads.length} loads saved</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : loads.length === 0 ? (
        <div className="glass rounded-xl border border-dark-400/40 py-20 text-center">
          <BookmarkCheck size={36} className="text-dark-500 mx-auto mb-3" />
          <p className="text-dark-300">No saved loads yet.</p>
          <p className="text-dark-500 text-sm mt-1">Bookmark loads from the Load Board to track them here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loads.map(l => <LoadCard key={l.id} load={l} />)}
        </div>
      )}
    </div>
  );
}
