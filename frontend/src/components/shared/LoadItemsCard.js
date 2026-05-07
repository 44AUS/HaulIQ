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

  const originCity = load.origin || null;
  const destCity   = isRaw ? (load.destination || null) : (load.dest || null);
  const perMile    = isRaw ? load.rate_per_mile  : load.ratePerMile;
  const miles      = load.miles;
  const weight     = isRaw
    ? (load.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : null)
    : load.weight;
  const pickupDate = isRaw ? fmt(load.pickup_date)   : load.pickup;
  const delivDate  = isRaw ? fmt(load.delivery_date) : load.delivery;

  const hasLane = originCity || destCity;

  const cols = [
    { label: 'Lane',          key: 'lane',   show: hasLane },
    { label: 'Per Mile',      value: perMile  ? `$${Number(perMile).toFixed(2)}`  : null },
    { label: 'Miles',         value: miles    ? Number(miles).toLocaleString()    : null },
    { label: 'Weight',        value: weight },
    { label: 'Pickup Date',   value: pickupDate },
    { label: 'Delivery Date', value: delivDate },
  ].filter(c => c.key === 'lane' ? c.show : c.value);

  if (cols.length === 0) return null;

  const thStyle = {
    padding: '10px 12px', textAlign: 'left',
    fontSize: '0.72rem', fontWeight: 400, color: 'var(--ion-color-medium)',
    backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap',
  };
  const tdBase = {
    padding: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)',
    borderBottom: '1px solid var(--ion-border-color)', height: 64, verticalAlign: 'middle',
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
                {cols.map(c => {
                  if (c.key === 'lane') {
                    return (
                      <td key="lane" style={{ ...tdBase, paddingLeft: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, paddingLeft: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                            <IonIcon name="ellipse" style={{ fontSize: 8, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                            <div style={{ width: 1.5, flex: 1, backgroundColor: 'var(--ion-border-color)', margin: '2px 0' }} />
                            <IonIcon name="square-outline" style={{ fontSize: 8, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: '0.75rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6 }}>{originCity || '—'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6 }}>{destCity || '—'}</span>
                          </div>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={c.label} style={{ ...tdBase, padding: '0 12px', whiteSpace: 'nowrap' }}>
                      {c.value}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
