import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { searchApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const SEARCH_CATS = [
  { key: 'loads_in_progress', label: 'Loads',             icon: 'layers-outline' },
  { key: 'saved_loads',       label: 'Load Board',        icon: 'search-outline' },
  { key: 'equipment',         label: 'My Equipment',      icon: 'bus-outline' },
  { key: 'lane_watches',      label: 'Lane Watch',        icon: 'eye-outline' },
  { key: 'payments',          label: 'Payments',          icon: 'cash-outline' },
  { key: 'documents',         label: 'Documents',         icon: 'document-outline' },
  { key: 'drivers',           label: 'Employees / Drivers', icon: 'people-outline' },
  { key: 'connections',       label: 'Connections',       icon: 'person-outline' },
  { key: 'messages',          label: 'Messages',          icon: 'chatbubble-outline' },
];

function getLabel(key, item) {
  switch (key) {
    case 'loads_in_progress':
    case 'saved_loads':
    case 'completed_loads':
      return `${item.origin} → ${item.destination}`;
    case 'equipment':
      return `${item.equipment_type} · ${item.current_location}`;
    case 'lane_watches':
      return [item.origin_city, item.origin_state].filter(Boolean).join(', ') + ' → ' +
             [item.dest_city, item.dest_state].filter(Boolean).join(', ') || 'Any lane';
    case 'payments':
      return `${item.origin} → ${item.destination}`;
    case 'documents':
      return item.file_name;
    case 'drivers':
    case 'connections':
      return item.name;
    case 'messages':
      return `${item.other_name}: ${item.body}`;
    default:
      return item.name || item.id;
  }
}

function getSub(key, item) {
  switch (key) {
    case 'loads_in_progress':
    case 'saved_loads':
      return item.commodity ? `${item.commodity} · $${item.rate?.toLocaleString()}` : `$${item.rate?.toLocaleString()}`;
    case 'equipment':
      return item.preferred_origin ? `Pref. origin: ${item.preferred_origin}` : null;
    case 'lane_watches':
      return item.equipment_type || null;
    case 'payments':
      return `$${item.amount?.toFixed(2)} · ${item.status}`;
    case 'documents':
      return item.doc_type;
    case 'drivers':
      return 'Driver';
    case 'connections':
      return item.company || item.role;
    case 'messages':
      return 'Message';
    default:
      return null;
  }
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', color: 'var(--ion-color-medium)' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, opacity: 0.5 }}>
        <IonIcon name="search-outline" style={{ fontSize: 24 }} />
      </div>
      <span style={{ fontSize: '0.875rem' }}>No results found</span>
    </div>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.trim().length < 2) { setResults({}); return; }
    setLoading(true);
    searchApi.search(q.trim())
      .then(setResults)
      .catch(() => setResults({}))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div style={{ padding: '4px 6px' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>
          {q ? `Top 10 search results for "${q}"` : 'Search results'}
        </h2>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <IonSpinner name="crescent" />
        </div>
      )}

      {!loading && results !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SEARCH_CATS.map(({ key, label, icon }) => {
            const items = (results[key] || []).slice(0, 10);
            return (
              <div key={key} style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px 10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>
                  {label}
                </div>
                {items.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div>
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.conv_id ? `${item.path}?conv=${item.conv_id}` : item.path)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--ion-border-color)', transition: 'background-color 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--ion-color-step-50, rgba(0,0,0,0.04))'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <IonIcon name={icon} style={{ fontSize: 20, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ion-text-color)' }}>
                            {getLabel(key, item)}
                          </div>
                          {getSub(key, item) && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                              {getSub(key, item)}
                            </div>
                          )}
                        </div>
                        <IonIcon name="chevron-forward-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
