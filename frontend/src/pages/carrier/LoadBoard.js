import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { loadsApi, equipmentTypesApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

const SORT_OPTIONS = [
  { value: 'profit', label: 'Highest Net Profit' },
  { value: 'rate',   label: 'Highest Rate/Mile' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'miles',  label: 'Most Miles' },
];
const DEADHEAD_OPTIONS = [
  { value: '',    label: 'Any' },
  { value: '25',  label: '25 mi' },
  { value: '50',  label: '50 mi' },
  { value: '100', label: '100 mi' },
  { value: '150', label: '150 mi' },
  { value: '200', label: '200 mi' },
  { value: '300', label: '300 mi' },
];
const INIT = {
  origin: '', originDeadhead: '',
  dest: '', destDeadhead: '',
  equipTypes: [],
  loadSize: '',
  minLength: '', maxLength: '',
  maxWeight: '',
  dateFrom: '', dateTo: '',
  sort: 'recent',
};
const TABS = [
  { key: 'all',         label: 'ALL' },
  { key: 'high_profit', label: 'HIGH PROFIT' },
  { key: 'marginal',    label: 'MARGINAL' },
  { key: 'loss_risk',   label: 'LOSS RISK' },
  { key: 'hot',         label: 'HOT ONLY' },
];

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 400, color: 'var(--ion-color-medium)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', height: 64, verticalAlign: 'middle' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };
const sectionLabel = { display: 'block', marginBottom: 6, color: 'var(--ion-color-medium)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };

function TableView({ loads, equipmentTypes }) {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState(() => new Set(loads.filter(l => l.saved).map(l => l.id)));

  const handleSave = (e, load) => {
    e.stopPropagation();
    setSavedIds(prev => { const n = new Set(prev); n.has(load.id) ? n.delete(load.id) : n.add(load.id); return n; });
    loadsApi.toggleSave(load._raw.id).catch(() =>
      setSavedIds(prev => { const n = new Set(prev); n.has(load.id) ? n.delete(load.id) : n.add(load.id); return n; })
    );
  };

  const abbrMap = {};
  equipmentTypes.forEach(t => { abbrMap[t.name] = t.abbreviation || t.name.slice(0, 3).toUpperCase(); });

  const PROFIT_BAR = { green: '#2dd36f', yellow: '#ffce00', red: '#eb445a' };
  const PROFIT_COLOR = { green: '#2e7d32', yellow: '#ed6c02', red: '#d32f2f' };

  if (!loads.length) return null;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 80, minWidth: 80 }}>Age</th>
            <th style={{ ...thStyle, minWidth: 100 }}>Broker</th>
            <th style={{ ...thStyle, minWidth: 90 }}>Pickup</th>
            <th style={{ ...thStyle, minWidth: 80 }}>Rate</th>
            <th style={{ ...thStyle, minWidth: 70 }}>Trip</th>
            <th style={{ ...thStyle, minWidth: 180 }}>Lane</th>
            <th style={{ ...thStyle, minWidth: 70 }}>DH-O</th>
            <th style={{ ...thStyle, minWidth: 90 }}>Delivery</th>
            <th style={{ ...thStyle, minWidth: 90 }}>Equipment</th>
            <th style={{ ...thStyle, minWidth: 90 }}>Net Profit</th>
            <th style={{ ...thStyle, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {loads.map(load => {
            const isSaved    = savedIds.has(load.id);
            const originCity = load.origin || '—';
            const destCity   = load.dest   || '—';
            const abbr       = abbrMap[load.type] || load.type?.slice(0, 3).toUpperCase() || '—';
            const barColor   = PROFIT_BAR[load.profitScore] || '#9e9e9e';
            const netColor   = PROFIT_COLOR[load.profitScore] || 'var(--ion-text-color)';
            const equipParts = [
              abbr,
              load.weight || null,
              load.trailerLength ? `${load.trailerLength} ft` : null,
              load.loadSize === 'partial' ? 'LTL' : 'FTL',
            ].filter(Boolean);
            const initials = load.broker?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?';

            return (
              <tr key={load.id} onClick={() => navigate(`/carrier/loads/${load.id}`, { state: { from: 'Load Board' } })} style={{ cursor: 'pointer', height: 64 }}>
                <td style={{ ...tdStyle, padding: '0 12px', width: 80 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{load.posted}</span>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 100 }}>
                  {load.broker ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>{initials}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{load.broker.name}</span>
                        {load.broker.rating > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IonIcon name="star" style={{ fontSize: 9, color: '#ed6c02' }} />
                            <span style={{ fontSize: '0.6rem', color: 'var(--ion-color-medium)' }}>{load.broker.rating?.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>—</span>}
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 90 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{load.pickup}</span>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 80 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap' }}>${load.rate?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', whiteSpace: 'nowrap' }}>${load.ratePerMile}/mi</span>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 70 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{load.miles} mi</span>
                </td>

                {/* Lane — accent bar */}
                <td style={{ ...tdStyle, paddingLeft: 0, position: 'relative', minWidth: 180 }}>
                  <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, backgroundColor: barColor, borderRadius: '0 2px 2px 0' }} />
                  <div style={{ paddingLeft: 16, display: 'flex', alignItems: 'stretch', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
                      <IonIcon name="ellipse" style={{ fontSize: 8, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                      <div style={{ width: 1.5, flex: 1, backgroundColor: 'var(--ion-border-color)', margin: '2px 0' }} />
                      <IonIcon name="square-outline" style={{ fontSize: 8, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6 }}>{originCity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.6 }}>{destCity}</span>
                    </div>
                  </div>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 70 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{load.deadhead > 0 ? `${load.deadhead} mi` : '—'}</span>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 90 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{load.delivery}</span>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 90 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap' }}>{abbr}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--ion-color-medium)', display: 'block', whiteSpace: 'nowrap' }}>{equipParts.slice(1).join(' · ')}</span>
                </td>

                <td style={{ ...tdStyle, padding: '0 12px', minWidth: 90 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', color: netColor }}>${load.netProfit?.toLocaleString()}</span>
                </td>

                <td style={{ ...tdStyle, width: 60, paddingRight: 6 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={e => handleSave(e, load)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                      <IonIcon name={isSaved ? 'bookmark' : 'bookmark-outline'} style={{ fontSize: 15 }} />
                    </button>
                    <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
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

function FilterDrawer({ open, onClose, pf, setPF, onApply, onClear, equipmentTypes }) {
  return createPortal(
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1200 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, backgroundColor: 'var(--ion-card-background)', zIndex: 1201, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ion-text-color)' }}>Filter</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem' }}>CLEAR</button>
            <button onClick={onApply} style={{ padding: '4px 16px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem' }}>APPLY</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {/* Origin */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Origin</span>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IonIcon name="search-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} /></span>
              <input style={{ ...inputStyle, paddingLeft: 32, paddingRight: pf.origin ? 32 : 12 }} placeholder="e.g. Chicago, IL" value={pf.origin} onChange={e => setPF('origin', e.target.value)} />
              {pf.origin && <button onClick={() => setPF('origin', '')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}><IonIcon name="close-outline" style={{ fontSize: 12, color: 'var(--ion-color-medium)' }} /></button>}
            </div>
            <select style={inputStyle} value={pf.originDeadhead} onChange={e => setPF('originDeadhead', e.target.value)}>
              {DEADHEAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Destination */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Destination</span>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IonIcon name="search-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} /></span>
              <input style={{ ...inputStyle, paddingLeft: 32, paddingRight: pf.dest ? 32 : 12 }} placeholder="e.g. Atlanta, GA" value={pf.dest} onChange={e => setPF('dest', e.target.value)} />
              {pf.dest && <button onClick={() => setPF('dest', '')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}><IonIcon name="close-outline" style={{ fontSize: 12, color: 'var(--ion-color-medium)' }} /></button>}
            </div>
            <select style={inputStyle} value={pf.destDeadhead} onChange={e => setPF('destDeadhead', e.target.value)}>
              {DEADHEAD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Equipment Types */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Equipment Types</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {equipmentTypes.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
                  <input
                    type="checkbox"
                    checked={pf.equipTypes.includes(t.name)}
                    onChange={e => setPF('equipTypes', e.target.checked ? [...pf.equipTypes, t.name] : pf.equipTypes.filter(x => x !== t.name))}
                    style={{ width: 14, height: 14 }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          {/* Load Size */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Load Size</span>
            <select style={inputStyle} value={pf.loadSize} onChange={e => setPF('loadSize', e.target.value)}>
              <option value="">Full &amp; Partial</option>
              <option value="full">Full Truckload (FTL)</option>
              <option value="partial">Partial Truckload (LTL)</option>
            </select>
          </div>

          {/* Max Weight */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Max Weight</span>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, paddingRight: 36 }} type="number" min={0} placeholder="45000" value={pf.maxWeight} onChange={e => setPF('maxWeight', e.target.value)} />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>lbs</span>
            </div>
          </div>

          {/* Trailer Length */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Trailer Length</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 28 }} type="number" min={0} placeholder="Min" value={pf.minLength} onChange={e => setPF('minLength', e.target.value)} />
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>ft</span>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 28 }} type="number" min={0} placeholder="Max" value={pf.maxLength} onChange={e => setPF('maxLength', e.target.value)} />
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>ft</span>
              </div>
            </div>
          </div>

          {/* Pickup Date */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={sectionLabel}>Pickup Date</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1, fontSize: 12 }} type="date" value={pf.dateFrom} onChange={e => setPF('dateFrom', e.target.value)} />
              <input style={{ ...inputStyle, flex: 1, fontSize: 12 }} type="date" value={pf.dateTo} onChange={e => setPF('dateTo', e.target.value)} />
            </div>
          </div>

          {/* Sort By */}
          <div style={{ padding: '10px 20px' }}>
            <span style={sectionLabel}>Sort By</span>
            <select style={inputStyle} value={pf.sort} onChange={e => setPF('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function LoadBoard() {
  const [pf, setPF_state]             = useState(INIT);
  const [appliedFilters, setAppliedFilters] = useState(INIT);
  const [loads, setLoads]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState(null);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [activeTab, setActiveTab]     = useState('all');
  const [filterOpen, setFilterOpen]   = useState(false);
  const [spinning, setSpinning]       = useState(false);
  const autoTimer = useRef(null);

  const setPF = (key, val) => setPF_state(f => ({ ...f, [key]: val }));

  useEffect(() => {
    equipmentTypesApi.list()
      .then(d => setEquipmentTypes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const buildParams = (f) => {
    const p = {};
    if (f.origin)            p.origin              = f.origin;
    if (f.originDeadhead)    p.max_origin_deadhead  = f.originDeadhead;
    if (f.dest)              p.dest                = f.dest;
    if (f.equipTypes.length) p.load_types          = f.equipTypes.join(',');
    if (f.loadSize)          p.load_size           = f.loadSize;
    if (f.maxWeight)         p.max_weight          = f.maxWeight;
    if (f.minLength)         p.min_length          = f.minLength;
    if (f.maxLength)         p.max_length          = f.maxLength;
    if (f.dateFrom)          p.pickup_date_from    = f.dateFrom;
    if (f.dateTo)            p.pickup_date_to      = f.dateTo;
    p.sort_by = { profit: 'profit', rate: 'rate_per_mile', recent: 'recent', miles: 'miles' }[f.sort] || 'recent';
    return p;
  };

  const fetchLoads = useCallback((f) => {
    clearTimeout(autoTimer.current);
    setLoading(true);
    setAppliedFilters(f);
    loadsApi.list(buildParams(f))
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchLoads(INIT); }, [fetchLoads]);

  const refresh = () => {
    setSpinning(true);
    loadsApi.list(buildParams(appliedFilters))
      .then(res => { setLoads(adaptLoadList(res)); setApiError(null); })
      .catch(err => setApiError(err.message))
      .finally(() => setSpinning(false));
  };

  const hasActive = JSON.stringify(pf) !== JSON.stringify(INIT);

  const tabLoads = useMemo(() => {
    switch (activeTab) {
      case 'high_profit': return loads.filter(l => l.profitScore === 'green');
      case 'marginal':    return loads.filter(l => l.profitScore === 'yellow');
      case 'loss_risk':   return loads.filter(l => l.profitScore === 'red');
      case 'hot':         return loads.filter(l => l.hot);
      default:            return loads;
    }
  }, [loads, activeTab]);

  const tabCounts = useMemo(() => ({
    all:         loads.length,
    high_profit: loads.filter(l => l.profitScore === 'green').length,
    marginal:    loads.filter(l => l.profitScore === 'yellow').length,
    loss_risk:   loads.filter(l => l.profitScore === 'red').length,
    hot:         loads.filter(l => l.hot).length,
  }), [loads]);

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)', letterSpacing: '-0.01em' }}>Load Board</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              {loading ? 'Loading…' : `${tabLoads.length} loads available`}
            </p>
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', border: `1px solid ${hasActive ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 4, backgroundColor: 'transparent', color: hasActive ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            <IonIcon name="funnel-outline" style={{ fontSize: 16 }} /> Filter
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--ion-card-background)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count    = tabCounts[tab.key] ?? 0;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', cursor: 'pointer', flexShrink: 0, border: 'none', borderBottom: isActive ? '2px solid var(--ion-text-color)' : '2px solid transparent', backgroundColor: 'transparent', color: isActive ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', opacity: isActive ? 1 : 0.6, fontFamily: 'inherit', transition: 'opacity 0.15s' }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</span>
                <span style={{ backgroundColor: 'var(--ion-color-primary)', borderRadius: 4, padding: '1px 5px', minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{count}</span>
                </span>
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
            <button title="Refresh" onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, borderRadius: 4, display: 'flex' }}>
              <IonIcon name="refresh-outline" style={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : apiError ? (
            <div style={{ border: '1px solid #d32f2f', borderRadius: 8, margin: 16, padding: 32, textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', color: '#d32f2f' }}>{apiError}</p>
              <button onClick={() => fetchLoads(appliedFilters)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}>Retry</button>
            </div>
          ) : tabLoads.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <IonIcon name="car-sport-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No loads match your filters</p>
              {hasActive && (
                <button onClick={() => { setPF_state(INIT); fetchLoads(INIT); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <TableView loads={tabLoads} equipmentTypes={equipmentTypes} />
          )}
        </div>

      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        pf={pf}
        setPF={setPF}
        onApply={() => { fetchLoads(pf); setFilterOpen(false); }}
        onClear={() => { setPF_state(INIT); fetchLoads(INIT); setFilterOpen(false); }}
        equipmentTypes={equipmentTypes}
      />
    </div>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
