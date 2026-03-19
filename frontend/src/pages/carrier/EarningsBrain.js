import React from 'react';
import { Brain, ChevronRight, Lock } from 'lucide-react';
import { BRAIN_INSIGHTS, LANE_PERFORMANCE } from '../../data/sampleData';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const TAG_COLORS = {
  'high-profit': 'badge-green',
  'warning':     'badge-red',
  'timing':      'badge-yellow',
  'insight':     'badge-blue',
  'savings':     'badge-green',
};


function InsightCard({ insight, locked }) {
  return (
    <div className={`glass rounded-xl p-5 border transition-all ${locked ? 'border-dark-400/20 opacity-60' : 'border-dark-400/40 hover:border-brand-500/20'} relative overflow-hidden`}>
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
        <div className="text-2xl flex-shrink-0">{insight.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{insight.title}</h3>
            <span className={TAG_COLORS[insight.tag] || 'badge-blue'}>{insight.tag}</span>
          </div>
          <p className="text-dark-200 text-sm leading-relaxed">{insight.body}</p>
          <button className="text-brand-400 text-xs hover:text-brand-300 mt-2 flex items-center gap-1">
            {insight.action} <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EarningsBrain() {
  const { user } = useAuth();
  const isPro = user?.plan === 'pro' || user?.plan === 'elite';
  const isElite = user?.plan === 'elite';

  const visibleInsights = isPro ? BRAIN_INSIGHTS : BRAIN_INSIGHTS.slice(0, 1);
  const lockedInsights = isPro ? [] : BRAIN_INSIGHTS.slice(1);

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
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isElite ? 'badge-blue' : isPro ? 'badge-green' : 'badge-yellow'
        }`}>
          {isElite ? '⚡ Elite — Full Access' : isPro ? '✅ Pro — Basic Insights' : '🔒 Basic — Limited'}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Insights Generated', value: '24', sub: 'This month' },
          { label: 'Estimated Savings', value: '$1,240', sub: 'From avoided bad loads' },
          { label: 'Brokers Flagged', value: '3', sub: 'Based on your history' },
          { label: 'Best Lane Found', value: 'CHI→ATL', sub: '$2,340 avg net' },
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
        <div className="grid md:grid-cols-2 gap-4">
          {visibleInsights.map(i => <InsightCard key={i.id} insight={i} locked={false} />)}
          {lockedInsights.map(i => <InsightCard key={i.id} insight={i} locked={true} />)}
        </div>
      </div>

      {/* Lane performance */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Your Lane Performance</h2>
          {!isPro && <span className="badge-yellow text-xs">Pro+ required for full view</span>}
        </div>
        <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
          <div className="grid grid-cols-4 bg-dark-700/60 px-5 py-3 text-dark-300 text-xs font-medium uppercase tracking-wider">
            <span>Lane</span><span className="text-center">Runs</span><span className="text-center">Avg Net</span><span className="text-center">Profitability</span>
          </div>
          {LANE_PERFORMANCE.map((lane, i) => (
            <div key={lane.lane} className={`grid grid-cols-4 px-5 py-4 border-b border-dark-400/20 hover:bg-dark-700/20 transition-colors ${!isPro && i > 1 ? 'opacity-30 blur-sm pointer-events-none select-none' : ''}`}>
              <span className="text-white font-medium text-sm">{lane.lane}</span>
              <span className="text-dark-200 text-sm text-center">{lane.runs}x</span>
              <span className="text-white font-semibold text-sm text-center">${lane.avgNet.toLocaleString()}</span>
              <div className="flex items-center justify-center gap-2">
                <div className="w-24 bg-dark-600 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${lane.profitability >= 80 ? 'bg-brand-500' : lane.profitability >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${lane.profitability}%` }} />
                </div>
                <span className={`text-xs font-semibold ${lane.profitability >= 80 ? 'text-brand-400' : lane.profitability >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {lane.profitability}%
                </span>
              </div>
            </div>
          ))}
        </div>
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
