import React from 'react';
import { BookmarkCheck } from 'lucide-react';
import { LOADS } from '../../data/sampleData';
import LoadCard from '../../components/carrier/LoadCard';

export default function SavedLoads() {
  const saved = LOADS.filter(l => l.saved);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookmarkCheck size={22} className="text-brand-400" />Saved Loads</h1>
        <p className="text-dark-300 text-sm mt-1">{saved.length} loads saved</p>
      </div>
      {saved.length === 0 ? (
        <div className="glass rounded-xl border border-dark-400/40 py-20 text-center">
          <BookmarkCheck size={36} className="text-dark-500 mx-auto mb-3" />
          <p className="text-dark-300">No saved loads yet.</p>
          <p className="text-dark-500 text-sm mt-1">Bookmark loads from the Load Board to track them here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {saved.map(l => <LoadCard key={l.id} load={l} />)}
        </div>
      )}
    </div>
  );
}
