import React, { useState, useEffect } from 'react';
import { Brain, ChevronRight, Lock, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const TAG_COLORS = {
  'high-profit': 'badge-green',
  'warning':     'badge-red',
  'timing':      'badge-yellow',
  'insight':     'badge-blue',
  'savings':     'badge-green',
};

function InsightCard({ insight, locked, onRead }) {
  return (
    <div
      className={`glass rounded-xl p-5 border transition-all ${locked ? 'border-dark-400/20 opacity-60' : 'border-dark-400/40 hover:border-brand-500/20'} relative overflow-hidden`}
      onClick={() => !locked && onRead && onRead(insight.id)}
    >
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800/70 backdrop-blur-sm z-10 rounded-xl">
          <div className="text-center">
            <Lock size={20} className="text-dark-400 mx-auto mb-2" />
            <p className="text-dark-300 text-xs">Pro or Elite required</p>
            <Link to="/carrier/dashboard" className="text-brand-400 text-xs hover:text-brand-300 mt-1 inline-block">Upgrade plan →</Link>
          </div>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="text-2xl flex-shrink-0">{insight.icon || '💡'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{insight.title}</h3>
            <span className={TAG_COLORS[insight.tag] || 'badge-blue'}>{insight.tag}</span>
          </div>
          <p className="text-dark-200 text-sm leading-relaxed">{insight.body}</p>
          {insight.action_label && (
            <button className="text-brand-400 text-xs hover:text-brand-300 mt-2 flex items-center gap-1">
              {insight.action_label} <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EarningsBrain() {
  const { user } = useAuth();
  const isPro = user?.plan === 'pro' || user?.plan === 'elite';
  const isElite = user?.plan === 'elite';

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = () => {
    setLoading(true);
    analyticsApi.insights()
      .then(data => { setInsights(Array.isArray(data) ? data : []); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInsights(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    analyticsApi.refresh()
      .then(() => fetchInsights())
      .catch(() => fetchInsights())
      .finally(() => setRefreshing(false));
  };

  const handleMarkRead = (insightId) => {
    analyticsApi.markRead(insightId).catch(() => {});
  };

  const visibleInsights = isPro ? insights : insights.slice(0, 1);
  const lockedInsights  = isPro ? [] : insights.slice(1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain size={22} className="text-brand-400" /> Driver Earnings Brain
          </h1>
          <p className="text-dark-300 text-sm mt-1">AI-powered insights that learn your patterns and maximize your earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 text-dark-300 hover:text-white text-sm border border-dark-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isElite ? 'badge-blue' : isPro ? 'badge-green' : 'badge-yellow'
          }`}>
            {isElite ? '⚡ Elite — Full Access' : isPro ? '✅ Pro — Basic Insights' : '🔒 Basic — Limited'}
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Insights Generated', value: insights.length || '—', sub: 'Available now' },
          { label: 'Estimated Savings', value: '$—', sub: 'From avoided bad loads' },
          { label: 'Brokers Flagged', value: '—', sub: 'Based on your history' },
          { label: 'Best Lane Found', value: '—', sub: 'Run more loads to unlock' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <p className="text-dark-300 text-xs">{label}</p>
            <p className="text-white font-bold text-xl">{value}</p>
            <p className="text-dark-400 text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* Insights grid */}
      <div>
        <h2 className="text-white font-semibold mb-4">This Week's Insights</h2>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
            <Brain size={32} className="text-dark-500 mx-auto mb-3" />
            <p className="text-dark-300">No insights yet. Complete more loads to generate personalized insights.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {visibleInsights.map(i => <InsightCard key={i.id} insight={i} locked={false} onRead={handleMarkRead} />)}
            {lockedInsights.map(i => <InsightCard key={i.id} insight={i} locked={true} onRead={null} />)}
          </div>
        )}
      </div>

      {/* Upgrade CTA if not elite */}
      {!isElite && (
        <div className="glass rounded-xl p-6 border border-purple-500/20 bg-purple-500/3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold mb-1">Unlock the Full Driver Earnings Brain</h3>
            <p className="text-dark-300 text-sm">Get predictive lane intelligence, broker blacklists, and weekly AI profit reports with Elite.</p>
          </div>
          <Link to="/carrier/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all flex-shrink-0 text-sm">
            Upgrade to Elite
          </Link>
        </div>
      )}
    </div>
  );
}
