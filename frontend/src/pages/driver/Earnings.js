import { useState, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { driverApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };

const PAY_STATUS = {
  paid:    { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32' },
  pending: { bg: 'rgba(237,108,2,0.12)',  color: '#ed6c02' },
  unpaid:  { bg: 'var(--ion-color-light)', color: 'var(--ion-color-medium)' },
};

export default function DriverEarnings() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverApi.earnings()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  const loads = data?.loads || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>Earnings</h2>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Paid',    value: data?.total_paid    || 0, color: '#2e7d32' },
          { label: 'Pending', value: data?.total_pending || 0, color: '#ed6c02' },
          { label: 'Unpaid',  value: data?.total_unpaid  || 0, color: 'var(--ion-color-medium)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...cardStyle, padding: '16px 12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>{label}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color, display: 'block' }}>
              ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      {/* Per-load breakdown */}
      <div style={cardStyle}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon name="cash-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ion-text-color)' }}>Load Breakdown</span>
        </div>
        <div style={{ padding: '0 20px' }}>
          {loads.length === 0 ? (
            <p style={{ margin: '16px 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No earnings yet.</p>
          ) : (
            loads.map((load, idx) => {
              const payCfg = PAY_STATUS[load.driver_pay_status] || PAY_STATUS.unpaid;
              return (
                <div key={load.booking_id} style={{ padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < loads.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block' }}>
                      {load.origin} → {load.destination}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
                      {load.tms_status?.replace(/_/g, ' ') || '—'}
                      {load.delivered_at ? ` · ${new Date(load.delivered_at).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block' }}>
                      ${load.driver_pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span style={{ display: 'inline-block', marginTop: 2, padding: '1px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: payCfg.bg, color: payCfg.color }}>
                      {load.driver_pay_status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
