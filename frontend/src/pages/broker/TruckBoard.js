import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { truckPostsApi, equipmentTypesApi, messagesApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const TABS = [
  { key: 'all',       label: 'ALL' },
  { key: 'available', label: 'AVAILABLE' },
  { key: 'expired',   label: 'EXPIRED' },
  { key: 'inactive',  label: 'INACTIVE' },
];

const STATUS_CHIP = {
  available: { label: 'Available', bg: '#2dd36f', text: '#fff' },
  expired:   { label: 'Expired',   bg: '#eb445a', text: '#fff' },
  inactive:  { label: 'Inactive',  bg: '#757575', text: '#fff' },
};

const STATUS_BAR = {
  available: '#2dd36f',
  expired:   '#eb445a',
  inactive:  '#616161',
};

function deriveStatus(post) {
  if (!post.is_active) return 'inactive';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const to = post.available_to ? new Date(post.available_to + 'T00:00:00') : null;
  if (to && to < today) return 'expired';
  return 'available';
}

const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

export default function TruckBoard() {
  const navigate = useNavigate();

  const [posts,           setPosts]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [spinning,        setSpinning]        = useState(false);
  const [equipmentTypes,  setEquipmentTypes]  = useState([]);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [locationSearch,  setLocationSearch]  = useState('');
  const [activeTab,       setActiveTab]       = useState('all');
  const debounceRef = useRef(null);

  useEffect(() => {
    equipmentTypesApi.list()
      .then(d => setEquipmentTypes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback((eqType, loc, spinner = false) => {
    if (spinner) setSpinning(true); else setLoading(true);
    const params = {};
    if (eqType) params.equipment_type = eqType;
    if (loc?.trim()) params.location = loc.trim();
    truckPostsApi.list(params)
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => { setLoading(false); setSpinning(false); });
  }, []);

  useEffect(() => { fetchPosts(equipmentFilter, locationSearch); }, [equipmentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPosts(equipmentFilter, val), 400);
  };

  const handleContact = async (e, post) => {
    e.stopPropagation();
    try {
      const convo = await messagesApi.direct(post.carrier_id);
      navigate(`/broker/messages?conv=${convo.id}`);
    } catch { navigate('/broker/messages'); }
  };

  const enriched = useMemo(() => posts.map(p => ({ ...p, _status: deriveStatus(p) })), [posts]);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return enriched;
    return enriched.filter(p => p._status === activeTab);
  }, [enriched, activeTab]);

  const tabCounts = useMemo(() => {
    const c = { all: enriched.length };
    TABS.slice(1).forEach(t => { c[t.key] = enriched.filter(p => p._status === t.key).length; });
    return c;
  }, [enriched]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 24px', flexShrink: 0, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ion-text-color)', letterSpacing: '-0.01em' }}>Available Trucks</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>Browse carrier capacity and reach out directly.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <IonIcon name="search-outline" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--ion-color-medium)' }} />
              <input
                placeholder="Search location…"
                value={locationSearch}
                onChange={handleLocationChange}
                style={{ width: 200, padding: '7px 12px 7px 32px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', color: 'var(--ion-text-color)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[{ id: '', name: 'All' }, ...equipmentTypes].map(t => (
                <button
                  key={t.id || 'all'}
                  onClick={() => setEquipmentFilter(t.id === '' ? '' : t.name)}
                  style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${(t.id === '' ? equipmentFilter === '' : equipmentFilter === t.name) ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, backgroundColor: (t.id === '' ? equipmentFilter === '' : equipmentFilter === t.name) ? 'var(--ion-color-primary)' : 'transparent', color: (t.id === '' ? equipmentFilter === '' : equipmentFilter === t.name) ? '#fff' : 'var(--ion-text-color)' }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--ion-card-background)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count    = tabCounts[tab.key] ?? 0;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', cursor: 'pointer', flexShrink: 0, background: 'none',
                border: 'none', borderBottom: isActive ? '2px solid var(--ion-text-color)' : '2px solid transparent',
                color: isActive ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</span>
                <span style={{ backgroundColor: isActive ? 'var(--ion-color-primary)' : 'var(--ion-color-light)', borderRadius: 4, padding: '1px 5px', minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? '#fff' : 'var(--ion-color-medium)', lineHeight: 1.4 }}>{count}</span>
                </span>
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
            <button
              title="Refresh"
              onClick={() => fetchPosts(equipmentFilter, locationSearch, true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 4 }}
            >
              <IonIcon name="refresh-outline" style={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : tabItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <IonIcon name="car-sport-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                {equipmentFilter || locationSearch ? 'No trucks match your filters.' : 'No trucks in this category.'}
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    {['Carrier', 'Equipment', 'Location', 'Available', 'Preferred Lane', 'Rate Exp.', 'Status', ''].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabItems.map(post => {
                    const chip     = STATUS_CHIP[post._status] || { label: post._status, bg: '#9e9e9e', text: '#fff' };
                    const barColor = STATUS_BAR[post._status] || '#9e9e9e';
                    return (
                      <tr key={post.id} style={{ height: 64 }}>
                        {/* Carrier — accent bar */}
                        <td style={{ ...tdStyle, position: 'relative', paddingLeft: 20, minWidth: 180 }}>
                          <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, backgroundColor: barColor, borderRadius: '0 2px 2px 0' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.carrier_name || 'Carrier'}</span>
                          {post.carrier_company && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.carrier_company}</span>
                          )}
                        </td>

                        <td style={{ ...tdStyle, minWidth: 140 }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.equipment_type}</span>
                          {(post.trailer_length || post.weight_capacity) && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>
                              {[post.trailer_length && `${post.trailer_length} ft`, post.weight_capacity && `${post.weight_capacity.toLocaleString()} lbs`].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </td>

                        <td style={{ ...tdStyle, minWidth: 160 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{post.current_location || '—'}</span>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 180, whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                            {fmtDate(post.available_from)} — {fmtDate(post.available_to)}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 120 }}>
                          {post.preferred_origin || post.preferred_destination ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {[post.preferred_origin, post.preferred_destination].filter(Boolean).join(' → ')}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>—</span>
                          )}
                        </td>

                        <td style={{ ...tdStyle, minWidth: 100 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: post.rate_expectation ? '#2e7d32' : 'var(--ion-color-medium)' }}>
                            {post.rate_expectation ? `$${post.rate_expectation.toFixed(2)}/mi` : 'Negotiable'}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, minWidth: 110 }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: chip.bg, color: chip.text }}>
                            {chip.label}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, width: 48 }} onClick={e => e.stopPropagation()}>
                          <button
                            title="Contact carrier"
                            onClick={e => handleContact(e, post)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 4 }}
                          >
                            <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} />
                          </button>
                        </td>
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
