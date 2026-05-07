import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { IonButton } from '@ionic/react';
import IonIcon from './IonIcon';
import mapVectorSrc from '../assets/map_vector.svg';

function extractState(location) {
  if (!location) return null;
  const m = String(location).match(/,\s*([A-Z]{2})(?:\s|\d|$)/);
  if (m) return m[1];
  const m2 = String(location).match(/\b([A-Z]{2})\b/);
  return m2 ? m2[1] : null;
}

const colHeader = { fontSize: '0.6rem', fontWeight: 700, color: 'var(--ion-color-medium)', letterSpacing: '0.1em', textTransform: 'uppercase' };

export default function LoadsCountPanel({ isOpen, onClose, loads = [] }) {
  const rows = useMemo(() => {
    const map = {};
    const bump = (key, field) => {
      if (!key) return;
      if (!map[key]) map[key] = { in: 0, out: 0 };
      map[key][field]++;
    };
    loads.forEach(load => {
      bump(extractState(load.destination || load.load_destination || load.dest), 'in');
      bump(extractState(load.origin      || load.load_origin      || load.pickup_location), 'out');
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([st, c]) => ({ st, in: c.in, out: c.out }));
  }, [loads]);

  const maxVal = Math.max(...rows.map(r => Math.max(r.in, r.out)), 1);

  return createPortal(
    <>
      {isOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1200 }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        backgroundColor: 'var(--ion-card-background)', zIndex: 1201,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ position: 'relative', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0, overflow: 'hidden', minHeight: 110 }}>
          {/* Map vector */}
          <img src={mapVectorSrc} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.15, pointerEvents: 'none', userSelect: 'none' }} />
          <div style={{ position: 'relative', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <img src="/urload-logo.png" alt="UrLoad" style={{ height: 36, objectFit: 'contain', marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
              <span style={{ display: 'block', fontWeight: 800, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 2 }}>National Loads Count</span>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Where the Loads Are</p>
            </div>
            <IonButton fill="clear" color="medium" size="small" onClick={onClose} style={{ position: 'absolute', top: 8, right: 4 }}>
              <IonIcon slot="icon-only" name="close-outline" />
            </IonButton>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', padding: '8px 16px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0, backgroundColor: 'var(--ion-background-color)' }}>
          <span style={colHeader}>ST</span>
          <span style={colHeader}>LOADS IN</span>
          <span style={{ ...colHeader, textAlign: 'right' }}>LOADS OUT</span>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rows.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No load data available</span>
            </div>
          ) : rows.map(row => (
            <div key={row.st} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 6, padding: '7px 16px', borderBottom: '1px solid var(--ion-border-color)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>{row.st}</span>

              {/* Loads In */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4a90d9', minWidth: 32, textAlign: 'right' }}>{row.in}</span>
                <div style={{ flex: 1, height: 10, backgroundColor: 'rgba(74,144,217,0.18)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(row.in / maxVal) * 100}%`, height: '100%', backgroundColor: '#0033a0', borderRadius: 2 }} />
                </div>
              </div>

              {/* Loads Out */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <div style={{ flex: 1, height: 10, backgroundColor: 'rgba(74,144,217,0.18)', borderRadius: 2, overflow: 'hidden', transform: 'scaleX(-1)' }}>
                  <div style={{ width: `${(row.out / maxVal) * 100}%`, height: '100%', backgroundColor: '#0033a0', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4a90d9', minWidth: 32 }}>{row.out}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
