import { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { adaptHistory } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, display: 'inline-block' }} />;
}

function ScoreIcon({ score }) {
  if (score === 'green')  return <IonIcon name="trending-up-outline"   style={{ fontSize: 16, color: '#2e7d32' }} />;
  if (score === 'yellow') return <IonIcon name="remove-outline"        style={{ fontSize: 16, color: '#ed6c02' }} />;
  return                         <IonIcon name="trending-down-outline" style={{ fontSize: 16, color: '#d32f2f' }} />;
}

export default function LoadHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsApi.history()
      .then(data => setHistory(data.map(adaptHistory)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalNet   = history.reduce((s, l) => s + (l.net  || 0), 0);
  const totalGross = history.reduce((s, l) => s + (l.rate || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IonIcon name="time-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 26 }} />
          <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--ion-text-color)' }}>Load History</h2>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Your completed loads</p>
      </div>

      {loading ? (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[...Array(5)].map((_, i) => <th key={i} style={thStyle}><SkeletonBox width={80} height={12} /></th>)}
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[120, 100, 80, 80, 80].map((w, j) => (
                      <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
          {error}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Gross',     value: `$${totalGross.toLocaleString()}`, highlight: false },
              { label: 'Total Net',       value: `$${totalNet.toLocaleString()}`,   highlight: true },
              { label: 'Loads Completed', value: history.length,                   highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ ...cardStyle, flex: '1 1 180px', minWidth: 0, padding: '16px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</p>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: highlight ? 'var(--ion-color-primary)' : 'var(--ion-text-color)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {history.length === 0 ? (
            <div style={{ ...cardStyle, padding: '80px 0', textAlign: 'center' }}>
              <IonIcon name="time-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--ion-color-medium)' }}>No completed loads yet.</p>
            </div>
          ) : (
            <div style={cardStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr>
                      {['Date', 'Route', 'Miles', 'Rate', 'Net Profit', 'Broker', 'Score'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((load, idx) => (
                      <tr key={load.id} style={{ backgroundColor: idx % 2 === 1 ? 'var(--ion-color-light)' : 'transparent' }}>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{load.date}</td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontWeight: 600 }}>{load.origin} → {load.dest}</td>
                        <td style={tdStyle}>{load.miles}</td>
                        <td style={tdStyle}>${(load.rate || 0).toLocaleString()}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: (load.net || 0) > 0 ? '#2e7d32' : '#d32f2f' }}>
                          {(load.net || 0) >= 0 ? '+' : ''}${(load.net || 0).toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{load.broker}</td>
                        <td style={tdStyle}><ScoreIcon score={load.score} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
