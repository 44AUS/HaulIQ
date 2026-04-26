import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { rateConfirmationApi } from '../../services/api';
import IonIcon from '../IonIcon';

const TMS_LABEL = {
  dispatched:   { label: 'Dispatched',   bg: '#0288d1', color: '#fff' },
  picked_up:    { label: 'Picked Up',    bg: 'var(--ion-color-primary)', color: '#fff' },
  in_transit:   { label: 'In Transit',   bg: 'var(--ion-color-primary)', color: '#fff' },
  delivered:    { label: 'Delivered',    bg: '#2e7d32', color: '#fff' },
  pod_received: { label: 'POD Received', bg: '#2e7d32', color: '#fff' },
};

const STATUS_STYLES = {
  warning: { border: '1px solid #ed6c02', color: '#ed6c02', bg: 'transparent' },
  info:    { border: '1px solid #0288d1', color: '#0288d1', bg: 'transparent' },
  success: { border: '1px solid #2e7d32', color: '#2e7d32', bg: 'transparent' },
  default: { border: '1px solid var(--ion-border-color)', color: 'var(--ion-color-medium)', bg: 'transparent' },
};

function StatusChip({ label, styleKey }) {
  const s = STATUS_STYLES[styleKey] || STATUS_STYLES.default;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, border: s.border, color: s.color, backgroundColor: s.bg, fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function TmsBadge({ tms }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, backgroundColor: tms.bg, color: tms.color, fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {tms.label}
    </span>
  );
}

function nextActionLabel(row) {
  if (!row.tms_status && row.booking_status === 'approved') return { label: 'Assign Driver', color: 'warning' };
  if (row.tms_status === 'dispatched')   return { label: 'Awaiting Pickup',  color: 'default' };
  if (row.tms_status === 'picked_up')    return { label: 'In Transit',        color: 'info' };
  if (row.tms_status === 'in_transit')   return { label: 'Awaiting Delivery', color: 'info' };
  if (row.tms_status === 'delivered')    return { label: 'Mark POD',          color: 'warning' };
  if (row.tms_status === 'pod_received') return { label: 'Completed',         color: 'success' };
  return { label: row.booking_status, color: 'default' };
}

const thStyle = { fontWeight: 700, fontSize: 12, padding: '10px 12px', textAlign: 'left', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

export default function DispatcherTable({ rows, loading, onDispatch, onMarkPOD }) {
  const navigate = useNavigate();
  const [pdfLoading, setPdfLoading] = useState(null);

  const handleRateCon = async (bookingId) => {
    setPdfLoading(bookingId);
    try {
      await rateConfirmationApi.download(bookingId);
    } catch (e) {
      alert(e.message);
    } finally {
      setPdfLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <IonIcon name="car-sport-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', marginBottom: 8 }} />
        <span style={{ color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No active shipments to dispatch.</span>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
        <thead>
          <tr>
            {['Route', 'Carrier', 'Driver', 'Pickup Date', 'Rate', 'TMS Status', 'Next Action', 'Last Note', ''].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const next = nextActionLabel(row);
            const tms  = row.tms_status ? TMS_LABEL[row.tms_status] : null;
            return (
              <tr key={row.booking_id} style={{ backgroundColor: 'var(--ion-card-background)' }}>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.origin} → {row.destination}
                  </span>
                </td>

                <td style={tdStyle}>
                  <span style={{ display: 'block', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.carrier_name || '—'}
                  </span>
                  {row.carrier_mc && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>MC# {row.carrier_mc}</span>
                  )}
                </td>

                <td style={tdStyle}>
                  {row.driver_name ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IonIcon name="person-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                      <div>
                        <span style={{ display: 'block', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{row.driver_name}</span>
                        {row.driver_phone && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{row.driver_phone}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Not assigned</span>
                  )}
                </td>

                <td style={tdStyle}>
                  {row.pickup_date ? new Date(row.pickup_date).toLocaleDateString() : '—'}
                </td>

                <td style={tdStyle}>
                  <span style={{ fontWeight: 600 }}>${(row.rate || 0).toLocaleString()}</span>
                </td>

                <td style={tdStyle}>
                  {tms ? (
                    <TmsBadge tms={tms} />
                  ) : (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, backgroundColor: 'var(--ion-color-light)', color: 'var(--ion-color-medium)', fontSize: '0.72rem', fontWeight: 600 }}>
                      Not Dispatched
                    </span>
                  )}
                </td>

                <td style={tdStyle}>
                  {next.label === 'Assign Driver' ? (
                    <button onClick={() => onDispatch(row)} style={{ padding: '4px 10px', border: '1px solid #ed6c02', color: '#ed6c02', backgroundColor: 'transparent', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
                      Assign Driver
                    </button>
                  ) : next.label === 'Mark POD' ? (
                    <button onClick={() => onMarkPOD(row)} style={{ padding: '4px 10px', border: '1px solid #2e7d32', color: '#2e7d32', backgroundColor: 'transparent', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
                      Mark POD
                    </button>
                  ) : (
                    <StatusChip label={next.label} styleKey={next.color} />
                  )}
                </td>

                <td style={tdStyle}>
                  {row.last_check_call ? (
                    <span title={row.last_check_call} style={{ display: 'block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                      {row.last_check_call}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>—</span>
                  )}
                </td>

                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                    <button
                      title="Rate Confirmation PDF"
                      onClick={() => handleRateCon(row.booking_id)}
                      disabled={pdfLoading === row.booking_id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 4 }}
                    >
                      {pdfLoading === row.booking_id
                        ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
                        : <IonIcon name="document-outline" style={{ fontSize: 16 }} />
                      }
                    </button>
                    <button
                      title="Open Dispatch Detail"
                      onClick={() => navigate(`/broker/dispatch/${row.booking_id}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 4 }}
                    >
                      <IonIcon name="open-outline" style={{ fontSize: 16 }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
