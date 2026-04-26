import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };

function resolveAction(insight) {
  const label = insight.action_label || '';
  const lc    = label.toLowerCase();
  if (lc.includes('find loads') || lc.includes('alternative lanes') || lc.includes('optimize deadhead')) return { path: '/carrier/loads', state: { fromBrain: true, insight_type: insight.insight_type } };
  if (lc.startsWith('filter') && lc.includes('loads')) { const equipType = label.replace(/filter\s+/i, '').replace(/\s+loads?$/i, '').trim(); return { path: '/carrier/loads', state: { fromBrain: true, equipmentType: equipType } }; }
  if (lc.includes('flag this broker') || lc.includes('flag broker')) return { path: '/carrier/network', state: {} };
  if (lc.includes('set rate alert') || lc.includes('lane watch')) return { path: '/carrier/lane-watches', state: {} };
  if (lc.includes('calculator') || lc.includes('profit calc')) return { path: '/carrier/calculator', state: {} };
  if (lc.includes('log a load') || lc.includes('log load')) return { path: '/carrier/history', state: {} };
  if (lc.includes('upgrade')) return { path: '/carrier/billing', state: {} };
  return { path: '/carrier/loads', state: {} };
}

const TAG_BADGE = {
  'high-profit': { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32' },
  'warning':     { bg: 'rgba(211,47,47,0.12)',  color: '#d32f2f' },
  'timing':      { bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02' },
  'insight':     { bg: 'rgba(2,136,209,0.12)',  color: '#0288d1' },
  'savings':     { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32' },
};

function InsightCard({ insight, locked, onRead, onAction }) {
  const tag = TAG_BADGE[insight.tag] || TAG_BADGE.insight;
  return (
    <div
      onClick={() => !locked && !insight.is_read && onRead && onRead(insight.id)}
      style={{ ...cardStyle, position: 'relative', overflow: 'hidden', cursor: locked ? 'default' : insight.is_read ? 'default' : 'pointer', opacity: locked || insight.is_read ? (locked ? 0.7 : 0.6) : 1 }}
    >
      {locked && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1, borderRadius: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <IonIcon name="lock-closed-outline" style={{ color: 'var(--ion-color-medium)', fontSize: 24, display: 'block', margin: '0 auto 8px' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 8 }}>Pro or Elite required</span>
            <Link to="/carrier/dashboard" style={{ color: 'var(--ion-color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>Upgrade plan</Link>
          </div>
        </div>
      )}
      <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1 }}>{insight.icon || '💡'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{insight.title}</span>
            <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: tag.bg, color: tag.color }}>{insight.tag}</span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>{insight.body}</p>
          {insight.action_label && (
            <button
              onClick={e => { e.stopPropagation(); !locked && onAction && onAction(insight); }}
              style={{ background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer', color: 'var(--ion-color-primary)', fontSize: '0.75rem', fontFamily: 'inherit', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, opacity: locked ? 0.4 : 1 }}
            >
              {insight.action_label} <IonIcon name="chevron-forward-outline" style={{ fontSize: 12 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

export default function EarningsBrain() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isPro      = user?.plan === 'pro' || user?.plan === 'elite';
  const isElite    = user?.plan === 'elite';

  const handleAction = (insight) => {
    const { path, state } = resolveAction(insight);
    navigate(path, { state });
  };

  const [insights,   setInsights]   = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.insights(),
      isPro ? analyticsApi.summary() : Promise.resolve(null),
    ])
      .then(([ins, sum]) => { setInsights(Array.isArray(ins) ? ins : []); setSummary(sum || null); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isPro]);

  const handleRefresh = () => {
    setRefreshing(true);
    analyticsApi.refresh()
      .then(fresh => {
        setInsights(Array.isArray(fresh) ? fresh : []);
        if (isPro) analyticsApi.summary().then(s => setSummary(s || null)).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  const handleMarkRead = (insightId) => {
    analyticsApi.markRead(insightId)
      .then(() => setInsights(prev => prev.map(i => i.id === insightId ? { ...i, is_read: true } : i)))
      .catch(() => {});
  };

  const brokersWarnedCount = insights.filter(i => i.tag === 'warning' && i.insight_type === 'broker').length;
  const bestLane = summary?.best_lane || null;
  const estimatedSavings = summary
    ? Math.max(0, Math.round((summary.avg_deadhead_miles - 30) * 0.62 * summary.total_loads))
    : null;

  const visibleInsights = isPro ? insights : insights.slice(0, 1);
  const lockedInsights  = isPro ? [] : insights.slice(1);

  const planBadge = isElite
    ? { label: 'Elite — Full Access', bg: 'rgba(2,136,209,0.12)', color: '#0288d1' }
    : isPro
    ? { label: 'Pro — Basic Insights', bg: 'rgba(46,125,50,0.12)', color: '#2e7d32' }
    : { label: 'Basic — Limited', bg: 'rgba(237,108,2,0.12)', color: '#ed6c02' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IonIcon name="bulb-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 26 }} />
            <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--ion-text-color)' }}>Driver Earnings Brain</h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            AI-powered insights that learn your patterns and maximize your earnings
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}
          >
            <IonIcon name="refresh-outline" style={{ fontSize: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, backgroundColor: planBadge.bg, color: planBadge.color }}>
            {planBadge.label}
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Insights Generated', value: loading ? '—' : (insights.length || '0'), sub: 'Available now' },
          { label: 'Estimated Savings',  value: !isPro ? '—' : loading ? '—' : estimatedSavings != null ? `$${estimatedSavings.toLocaleString()}` : '$0', sub: 'From reducing deadhead miles' },
          { label: 'Brokers Flagged',    value: loading ? '—' : brokersWarnedCount || '0', sub: 'Based on your history' },
          { label: 'Best Lane Found',    value: !isPro ? '—' : loading ? '—' : (bestLane || '—'), sub: bestLane ? 'Your top earning lane' : 'Run more loads to unlock' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ ...cardStyle, flex: '1 1 180px', minWidth: 0, padding: 16, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</p>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ion-text-color)', display: 'block' }}>{value}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div>
        <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>This Week's Insights</p>
        {loading ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...cardStyle, flex: '1 1 320px', minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonBox width="60%" height={20} />
                <SkeletonBox width="80%" height={16} />
                <SkeletonBox width="50%" height={16} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{error}</div>
        ) : insights.length === 0 ? (
          <div style={{ ...cardStyle, padding: '64px 0', textAlign: 'center' }}>
            <IonIcon name="bulb-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--ion-color-medium)' }}>No insights yet. Complete more loads to generate personalized insights.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {visibleInsights.map(i => (
              <div key={i.id} style={{ flex: '1 1 320px', minWidth: 0 }}>
                <InsightCard insight={i} locked={false} onRead={handleMarkRead} onAction={handleAction} />
              </div>
            ))}
            {lockedInsights.map(i => (
              <div key={i.id} style={{ flex: '1 1 320px', minWidth: 0 }}>
                <InsightCard insight={i} locked={true} onRead={null} onAction={null} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {!isElite && (
        <div style={{ ...cardStyle, border: '1px solid #e65100', backgroundColor: 'rgba(230,81,0,0.04)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Unlock the Full Driver Earnings Brain</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Get predictive lane intelligence, broker blacklists, and weekly AI profit reports with Elite.</p>
            </div>
            <Link to="/carrier/dashboard" style={{ display: 'inline-block', padding: '9px 20px', backgroundColor: '#e65100', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
              Upgrade to Elite
            </Link>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
