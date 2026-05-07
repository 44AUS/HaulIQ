import { useState } from 'react';
import { IonButton, IonItem, IonLabel, IonList } from '@ionic/react';
import IonIcon from '../IonIcon';

function fmt(d) {
  if (!d) return null;
  const dt = new Date(d + (String(d).includes('T') ? '' : 'T00:00:00'));
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LoadItemsCard({ load, isRaw = false }) {
  const [expanded, setExpanded] = useState(true);

  if (!load) return null;

  const lane       = isRaw
    ? (load.origin && load.destination ? `${load.origin} → ${load.destination}` : null)
    : (load.origin && load.dest        ? `${load.origin} → ${load.dest}`        : null);
  const perMile    = isRaw ? load.rate_per_mile  : load.ratePerMile;
  const miles      = isRaw ? load.miles          : load.miles;
  const weight     = isRaw
    ? (load.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : null)
    : load.weight;
  const pickupDate = isRaw ? fmt(load.pickup_date)  : load.pickup;
  const delivDate  = isRaw ? fmt(load.delivery_date) : load.delivery;

  const cols = [
    { label: 'Lane',          value: lane },
    { label: 'Per Mile',      value: perMile  ? `$${Number(perMile).toFixed(2)}`      : null },
    { label: 'Miles',         value: miles    ? Number(miles).toLocaleString()         : null },
    { label: 'Weight',        value: weight },
    { label: 'Pickup Date',   value: pickupDate },
    { label: 'Delivery Date', value: delivDate },
  ].filter(c => c.value);

  if (cols.length === 0) return null;

  const thStyle = {
    padding: '8px 16px', textAlign: 'left',
    fontSize: '0.7rem', fontWeight: 700, color: 'var(--ion-color-medium)',
    letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    borderTop: '1px solid var(--ion-border-color)',
  };
  const tdStyle = {
    padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem',
    color: 'var(--ion-text-color)', whiteSpace: 'nowrap',
    borderTop: '1px solid var(--ion-border-color)',
  };

  return (
    <div style={{ marginBottom: 8, backgroundColor: 'var(--ion-card-background)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
      <IonList lines="none" style={{ padding: 0, margin: 0, '--ion-item-background': 'transparent', '--background': 'transparent' }}>
        <IonItem>
          <IonLabel style={{ fontWeight: 700, fontSize: '1rem' }}>Load Items</IonLabel>
          <IonButton slot="end" fill="clear" size="small" onClick={() => setExpanded(e => !e)}>
            <IonIcon slot="icon-only" name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} style={{ fontSize: 20 }} />
          </IonButton>
        </IonItem>
      </IonList>

      {expanded && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {cols.map(c => <th key={c.label} style={thStyle}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {cols.map(c => <td key={c.label} style={tdStyle}>{c.value}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
