import { useState, useEffect, useMemo } from 'react';
import { IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonBadge, IonButton, IonRippleEffect } from '@ionic/react';
import { freightPaymentsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';
import { useThemeMode } from '../../context/ThemeContext';

const TABS = [
  { key: 'all',      label: 'ALL' },
  { key: 'pending',  label: 'PENDING' },
  { key: 'paid',     label: 'PAID' },
  { key: 'past_due', label: 'PAST DUE' },
  { key: 'voided',   label: 'VOIDED' },
];

const STATUS_TAB = {
  pending:  'pending',
  escrowed: 'pending',
  released: 'paid',
  failed:   'past_due',
  refunded: 'voided',
};

const TAB_CHIP = {
  pending:  { label: 'Pending',   ionColor: 'warning' },
  escrowed: { label: 'In Escrow', ionColor: 'primary' },
  released: { label: 'Paid',      ionColor: 'success' },
  failed:   { label: 'Past Due',  ionColor: 'danger'  },
  refunded: { label: 'Voided',    ionColor: 'medium'  },
};

const STATUS_BAR = {
  pending:  '#ffce00',
  escrowed: '#2a7fff',
  released: '#2dd36f',
  failed:   '#eb445a',
  refunded: '#616161',
};

const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };
function RippleTd({ style, children, ...props }) {
  return <td className="ion-activatable" style={{ ...style, position: 'relative', overflow: 'hidden' }} {...props}><IonRippleEffect />{children}</td>;
}

const fmt = (n) =>
  n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const fmtDate = (s) => {
  if (!s) return '—';
  const utc = typeof s === 'string' && !s.endsWith('Z') && !s.includes('+') ? s + 'Z' : s;
  const d = new Date(utc);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
};

export default function CarrierPayments() {
  const { brandColor } = useThemeMode();
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [spinning,  setSpinning]  = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = (showSpinner = false) => {
    if (showSpinner) setSpinning(true); else setLoading(true);
    freightPaymentsApi.list()
      .then(d => setPayments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => { setLoading(false); setSpinning(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return payments;
    return payments.filter(p => STATUS_TAB[p.status] === activeTab);
  }, [payments, activeTab]);

  const tabCounts = useMemo(() => {
    const c = { all: payments.length };
    TABS.slice(1).forEach(t => { c[t.key] = payments.filter(p => STATUS_TAB[p.status] === t.key).length; });
    return c;
  }, [payments]);

  const pending = payments.filter(p => p.status === 'pending' || p.status === 'escrowed').reduce((s, p) => s + (p.carrier_amount || 0), 0);
  const paid    = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.carrier_amount || 0), 0);
  const pastDue = payments.filter(p => p.status === 'failed').reduce((s, p) => s + (p.carrier_amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ion-text-color)', letterSpacing: '-0.01em' }}>Payments</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>Freight payments for your completed loads</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Awaiting', value: fmt(pending), color: '#ffce00' },
              { label: 'Paid Out', value: fmt(paid),    color: '#2dd36f' },
              { label: 'Past Due', value: fmt(pastDue), color: '#eb445a' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--ion-color-light)', borderRadius: 8, padding: '6px 16px', minWidth: 80 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color }}>{value}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--ion-color-medium)', fontWeight: 600, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--ion-card-background)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <IonSegment
            value={activeTab}
            onIonChange={e => setActiveTab(String(e.detail.value))}
            style={{ '--background': 'transparent', flex: '0 0 auto' }}
          >
            {TABS.map(tab => (
              <IonSegmentButton
                key={tab.key}
                value={tab.key}
                layout="label-only"
                style={{ '--color': 'var(--ion-color-medium)', '--color-checked': 'var(--ion-text-color)', '--indicator-color': 'var(--ion-text-color)', '--border-radius': '0', '--padding-top': '0', '--padding-bottom': '0', minHeight: 46, flexShrink: 0 }}
              >
                <IonLabel style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>
                  {tab.label}
                  <span style={{ backgroundColor: 'var(--ion-background-color)', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)' }}>{tabCounts[tab.key] ?? 0}</span>
                </IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
            <IonButton fill="clear" shape="round" onClick={() => fetchData(true)} title="Refresh">
              <IonIcon slot="icon-only" name="refresh-outline" style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </IonButton>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : tabItems.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No payments in this category</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Route</th>
                    <th style={thStyle}>Load Rate</th>
                    <th style={thStyle}>Your Earnings</th>
                    <th style={thStyle}>Escrowed</th>
                    <th style={thStyle}>Paid Out</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {tabItems.map(p => {
                    const chip     = TAB_CHIP[p.status] || { label: p.status, ionColor: 'medium' };
                    const barColor = STATUS_BAR[p.status] || '#9e9e9e';
                    return (
                      <tr key={p.id} style={{ height: 64 }}>
                        <RippleTd style={{ ...tdStyle, position: 'relative', paddingLeft: 20, minWidth: 200 }}>
                          <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, backgroundColor: barColor, borderRadius: '0 2px 2px 0' }} />
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.load_origin || '—'} → {p.load_destination || '—'}</span>
                        </RippleTd>
                        <RippleTd style={{ ...tdStyle, color: 'var(--ion-color-medium)' }}>{fmt(p.amount)}</RippleTd>
                        <RippleTd style={{ ...tdStyle, fontWeight: 700, color: '#2e7d32' }}>{fmt(p.carrier_amount)}</RippleTd>
                        <RippleTd style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{fmtDate(p.escrowed_at)}</RippleTd>
                        <RippleTd style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{fmtDate(p.released_at)}</RippleTd>
                        <RippleTd style={{ ...tdStyle, width: 120, minWidth: 120 }}>
                          <IonBadge color={chip.ionColor} style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>
                            {chip.label}
                          </IonBadge>
                        </RippleTd>
                        <RippleTd style={{ ...tdStyle, width: 32, minWidth: 32, paddingRight: 8 }}>
                          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)', display: 'block' }} />
                        </RippleTd>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
