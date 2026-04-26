import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { bookingsApi, loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

const TABS = [
  { key: 'all',         label: 'ALL' },
  { key: 'scheduled',   label: 'SCHEDULED' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'completed',   label: 'COMPLETED' },
  { key: 'canceled',    label: 'CANCELED' },
  { key: 'saved',       label: 'SAVED' },
  { key: 'archived',    label: 'ARCHIVED' },
];

const STATUS_TAB = {
  quoted:     'scheduled',
  booked:     'scheduled',
  in_transit: 'in_progress',
};

const STATUS_CHIP = {
  quoted:     { label: 'Pending',     bg: '#9e9e9e',  color: '#fff' },
  booked:     { label: 'Scheduled',   bg: '#2a7fff',  color: '#fff' },
  in_transit: { label: 'In Progress', bg: '#ffce00',  color: '#000' },
  completed:  { label: 'Completed',   bg: '#2dd36f',  color: '#fff' },
  saved:      { label: 'Saved',       bg: '#757575',  color: '#fff' },
  archived:   { label: 'Archived',    bg: '#616161',  color: '#fff' },
};

const STATUS_BAR_COLOR = {
  quoted:     '#9e9e9e',
  booked:     '#1565C0',
  in_transit: '#ffce00',
  completed:  '#2dd36f',
  saved:      '#1565C0',
  archived:   '#616161',
};

const FILTER_FIELDS = [
  { key: 'equipment', label: 'Equipment Type', options: ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Box Truck'] },
  { key: 'status',    label: 'Status',         options: ['scheduled', 'in_progress', 'completed', 'saved'] },
  { key: 'broker',    label: 'Broker',         options: [] },
];

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 400, color: 'var(--ion-color-medium)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: 0, fontSize: '0.875rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', height: 64, verticalAlign: 'middle' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };

const TMS_STEPS  = ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'];
const TMS_LABELS = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered', 'POD Received'];

function TmsProgress({ tmsStatus }) {
  const active = tmsStatus ? TMS_STEPS.indexOf(tmsStatus) : -1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '12px 0' }}>
      {TMS_LABELS.map((label, idx) => {
        const done   = idx <= active;
        const cur    = idx === active;
        return (
          <div key={label} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: done ? 'var(--ion-color-primary)' : 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done && !cur && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                {cur && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />}
              </div>
              <span style={{ marginTop: 3, fontSize: '0.6rem', color: done ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', fontWeight: cur ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {idx < TMS_LABELS.length - 1 && <div style={{ flex: 1, height: 1, margin: '0 4px 16px', backgroundColor: done && idx < active ? 'var(--ion-color-primary)' : 'var(--ion-border-color)' }} />}
          </div>
        );
      })}
    </div>
  );
}

function FilterDrawer({ open, onClose, filters, onChange, onApply, onClear }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 300, backgroundColor: 'var(--ion-card-background)', zIndex: 1001, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ion-text-color)' }}>Filter</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem' }}>CLEAR</button>
            <button onClick={onApply} style={{ padding: '4px 16px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem' }}>APPLY</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {FILTER_FIELDS.map(field => (
            <div key={field.key} style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
              <span style={{ display: 'block', marginBottom: 6, color: 'var(--ion-color-medium)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{field.label}</span>
              <select style={inputStyle} value={filters[field.key] || ''} onChange={e => onChange(field.key, e.target.value)}>
                <option value="">{field.label}</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ display: 'block', marginBottom: 6, color: 'var(--ion-color-medium)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Range</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1, fontSize: 12 }} type="date" value={filters.date_from || ''} onChange={e => onChange('date_from', e.target.value)} />
              <input style={{ ...inputStyle, flex: 1, fontSize: 12 }} type="date" value={filters.date_to || ''} onChange={e => onChange('date_to', e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoadManager() {
  const navigate = useNavigate();

  const [active,     setActive]     = useState([]);
  const [completed,  setCompleted]  = useState([]);
  const [saved,      setSaved]      = useState([]);
  const [archived,   setArchived]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('all');
  const [showProgress, setShowProgress] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters]       = useState({});
  const [applied, setApplied]       = useState({});
  const [spinning, setSpinning]     = useState(false);
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [hoveredHeader, setHoveredHeader] = useState(false);
  const [selected,      setSelected]      = useState(new Set());
  const [flashingRows,  setFlashingRows]  = useState(new Set());

  const fetchAll = () => Promise.all([
    bookingsApi.inProgress().catch(() => []),
    bookingsApi.completed().catch(() => []),
    loadsApi.savedList().catch(() => []),
    bookingsApi.my().catch(() => []),
  ]);

  const applyFetch = ([act, comp, sv, myBookings]) => {
    setActive(Array.isArray(act) ? act : []);
    setCompleted(Array.isArray(comp) ? comp : []);
    setSaved(adaptLoadList(Array.isArray(sv) ? sv : []));
    setArchived(Array.isArray(myBookings) ? myBookings.filter(b => b.status === 'archived') : []);
  };

  const load = () => {
    setLoading(true);
    fetchAll().then(applyFetch).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    setSpinning(true);
    fetchAll().then(applyFetch).finally(() => setSpinning(false));
  };

  const allItems = useMemo(() => {
    const f = applied;

    const applyFilter = (items) => items.filter(item => {
      if (f.equipment && !(item.equipment || '').toLowerCase().includes(f.equipment.toLowerCase())) return false;
      if (f.date_from && item.date && new Date(item.date.date) < new Date(f.date_from)) return false;
      if (f.date_to   && item.date && new Date(item.date.date) > new Date(f.date_to + 'T23:59:59')) return false;
      return true;
    });

    const fmtDateTime = (iso) => {
      if (!iso) return null;
      const utc = typeof iso === 'string' && !iso.endsWith('Z') && !iso.includes('+') ? iso + 'Z' : iso;
      const d = new Date(utc);
      if (isNaN(d)) return null;
      const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '');
      return { date, time };
    };

    const activeItems = applyFilter(active.map((b) => ({
      _key:      b.booking_id || b.id,
      _tab:      STATUS_TAB[b.status] || 'scheduled',
      _nav:      () => navigate(`/carrier/active/${b.booking_id}`),
      date:      fmtDateTime(b.created_at),
      origin:    b.origin,
      dest:      b.destination,
      equipment: b.load_type,
      miles:     b.miles,
      rate:      b.rate,
      broker:    b.broker_name,
      status:    b.status,
      chipKey:   b.status,
      tmsStatus: b.tms_status || null,
    })));

    const completedItems = applyFilter(completed.map((b) => ({
      _key:      b.booking_id,
      _tab:      'completed',
      _nav:      () => {},
      date:      fmtDateTime(b.completed_at),
      origin:    b.origin,
      dest:      b.destination,
      equipment: b.load_type,
      miles:     b.miles,
      rate:      b.rate,
      broker:    b.broker_name,
      status:    'completed',
      chipKey:   'completed',
      tmsStatus: null,
    })));

    const savedItems = applyFilter(saved.map((l) => ({
      _key:      l.id,
      _tab:      'saved',
      _nav:      () => navigate(`/carrier/loads/${l.id}`),
      date:      l.savedAt ? fmtDateTime(l.savedAt) : null,
      origin:    l.origin,
      dest:      l.dest,
      equipment: l.type,
      miles:     l.miles,
      rate:      l.rate,
      broker:    l.broker?.name || null,
      status:    'saved',
      chipKey:   'saved',
      tmsStatus: null,
    })));

    const archivedItems = applyFilter(archived.map((b) => ({
      _key:      b.id,
      _tab:      'archived',
      _nav:      () => {},
      date:      fmtDateTime(b.created_at || b.updated_at),
      origin:    b.origin,
      dest:      b.destination,
      equipment: b.load_type,
      miles:     b.miles,
      rate:      b.rate,
      broker:    b.broker_name,
      status:    'archived',
      chipKey:   'archived',
      tmsStatus: null,
    })));

    return [...activeItems, ...completedItems, ...savedItems, ...archivedItems];
  }, [active, completed, saved, archived, applied, navigate]);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return allItems.filter(i => i._tab !== 'archived');
    return allItems.filter(i => i._tab === activeTab);
  }, [allItems, activeTab]);

  const tabCounts = useMemo(() => {
    const c = {};
    TABS.forEach(t => {
      if (t.key === 'all') c.all = allItems.filter(i => i._tab !== 'archived').length;
      else c[t.key] = allItems.filter(i => i._tab === t.key).length;
    });
    return c;
  }, [allItems]);

  const handleExport = () => {
    if (!tabItems.length) return;
    const rows = [['Date', 'Origin', 'Destination', 'Equipment', 'Miles', 'Rate', 'Broker', 'Status']];
    tabItems.forEach(item => rows.push([item.date || '', item.origin || '', item.dest || '', item.equipment || '', item.miles || '', item.rate || '', item.broker || '', item.status]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `loads_${activeTab}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const allKeys     = tabItems.map((item, i) => item._key || i);
  const allSelected = allKeys.length > 0 && allKeys.every(k => selected.has(k));
  const someSelected = !allSelected && allKeys.some(k => selected.has(k));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) { allKeys.forEach(k => next.delete(k)); }
      else             { allKeys.forEach(k => next.add(k)); }
      return next;
    });
  };

  const deletableKeys = tabItems
    .filter(i => i.chipKey === 'completed' || i.chipKey === 'archived')
    .map((i, idx) => i._key || idx)
    .filter(k => selected.has(k));

  const handleBulkDelete = async () => {
    for (const key of deletableKeys) {
      const item = tabItems.find((i, idx) => (i._key || idx) === key);
      if (!item) continue;
      try {
        if (item.chipKey === 'completed') await bookingsApi.archive(key);
        else await bookingsApi.destroy(key);
      } catch (_) {}
    }
    setSelected(prev => { const n = new Set(prev); deletableKeys.forEach(k => n.delete(k)); return n; });
    refresh();
  };

  const hasActiveFilters = Object.values(applied).some(Boolean);

  return (
    <>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes rowSelectFlash { 0% { background-color: rgba(0,0,0,0.09); } 100% { background-color: transparent; } }`}</style>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)', letterSpacing: '-0.01em' }}>Loads</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setShowProgress(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: showProgress ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 8px' }}>
            <span style={{ fontSize: 14 }}>≡</span> {showProgress ? 'Hide Progress' : 'Show Progress'}
          </button>
          <button onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', border: `1px solid ${hasActiveFilters ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 4, backgroundColor: 'transparent', color: hasActiveFilters ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <IonIcon name="funnel-outline" style={{ fontSize: 16 }} /> Filter
          </button>
          <button onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', border: '1px solid var(--ion-border-color)', borderRadius: 4, backgroundColor: 'transparent', color: 'var(--ion-color-medium)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <IonIcon name="download-outline" style={{ fontSize: 16 }} /> Export
          </button>
        </div>
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

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : tabItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
            <IonIcon name="car-sport-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No loads in this category</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {/* Date / select-all header */}
                  <th style={{ ...thStyle, width: 90, minWidth: 90, cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredHeader(true)}
                    onMouseLeave={() => setHoveredHeader(false)}
                    onClick={toggleAll}
                  >
                    {hoveredHeader || allSelected || someSelected ? (
                      <input
                        type="checkbox"
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        checked={allSelected}
                        onChange={toggleAll}
                        onClick={e => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>Date</span>
                    )}
                  </th>
                  {[['Route', 200], ['Equipment', 140], ['Miles', 80], ['Rate', 80], ['Broker', 120]].map(([h, min]) => (
                    <th key={h} style={{ ...thStyle, minWidth: min }}>{h}</th>
                  ))}
                  {/* Status / bulk delete header */}
                  {deletableKeys.length > 0 ? (
                    <th style={{ ...thStyle, width: 120, minWidth: 120 }}>
                      <button onClick={handleBulkDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.68rem', padding: '2px 4px' }}>
                        <IonIcon name="trash-outline" style={{ fontSize: 14 }} />
                        {deletableKeys.length > 1 ? `Delete (${deletableKeys.length})` : (tabItems.find((i, idx) => (i._key || idx) === deletableKeys[0])?.chipKey === 'archived' ? 'Delete' : 'Archive')}
                      </button>
                    </th>
                  ) : (
                    <th style={{ ...thStyle, width: 120, minWidth: 120 }}>Status</th>
                  )}
                  <th style={{ ...thStyle, width: 32, minWidth: 32 }} />
                </tr>
              </thead>
              <tbody>
                {tabItems.map((item, idx) => {
                  const chip     = STATUS_CHIP[item.chipKey] || { label: item.status, bg: '#9e9e9e', color: '#fff' };
                  const barColor = STATUS_BAR_COLOR[item.chipKey] || '#9e9e9e';
                  const rowKey   = item._key || idx;
                  const isHovered  = hoveredRow === rowKey;
                  const isSelected = selected.has(rowKey);
                  const isFlashing = flashingRows.has(rowKey);

                  const toggleSelect = (e) => {
                    e.stopPropagation();
                    setSelected(prev => { const next = new Set(prev); next.has(rowKey) ? next.delete(rowKey) : next.add(rowKey); return next; });
                    setFlashingRows(prev => { const next = new Set(prev); next.add(rowKey); return next; });
                    setTimeout(() => {
                      setFlashingRows(prev => { const next = new Set(prev); next.delete(rowKey); return next; });
                    }, 450);
                  };

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        onClick={item._nav}
                        onMouseEnter={() => setHoveredRow(rowKey)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ cursor: 'pointer', height: 64, animation: isFlashing ? 'rowSelectFlash 0.45s ease-out forwards' : undefined }}
                      >
                        {/* Date / checkbox */}
                        <td style={{ ...tdStyle, padding: '0 12px', width: 90 }} onClick={isHovered ? toggleSelect : undefined}>
                          {isHovered || isSelected ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={toggleSelect}
                              onClick={e => e.stopPropagation()}
                              style={{ cursor: 'pointer' }}
                            />
                          ) : item.date ? (
                            <div>
                              <span style={{ fontSize: '0.75rem', display: 'block', lineHeight: 1.3, color: 'var(--ion-text-color)' }}>{item.date.date}</span>
                              {item.date.time && <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', lineHeight: 1.3 }}>{item.date.time}</span>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>—</span>
                          )}
                        </td>

                        {/* Route — accent bar */}
                        <td style={{ ...tdStyle, paddingLeft: 0, position: 'relative', minWidth: 200 }}>
                          <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, backgroundColor: barColor, borderRadius: '0 2px 2px 0' }} />
                          <div style={{ paddingLeft: 16 }}>
                            <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', color: 'var(--ion-text-color)' }}>{item.origin} → {item.dest}</span>
                          </div>
                        </td>

                        <td style={{ ...tdStyle, padding: '0 12px', minWidth: 140 }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{item.equipment || '—'}</span>
                        </td>

                        <td style={{ ...tdStyle, padding: '0 12px' }}>
                          <span style={{ fontSize: '0.875rem' }}>{item.miles ? `${Number(item.miles).toLocaleString()} mi` : '—'}</span>
                        </td>

                        <td style={{ ...tdStyle, padding: '0 12px', whiteSpace: 'nowrap' }}>
                          {item.rate
                            ? <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2e7d32', display: 'block' }}>${Number(item.rate).toLocaleString()}</span>
                            : <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>—</span>}
                          {item.net != null && (
                            <span style={{ fontSize: '0.75rem', color: item.net >= 0 ? '#2e7d32' : '#d32f2f', display: 'block' }}>
                              Net {item.net >= 0 ? '+' : ''}${Number(item.net).toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td style={{ ...tdStyle, padding: '0 12px', minWidth: 120 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{item.broker || '—'}</span>
                        </td>

                        <td style={{ ...tdStyle, padding: '0 12px', width: 120, minWidth: 120 }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: chip.bg, color: chip.color }}>
                            {chip.label}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, width: 48, minWidth: 48, paddingRight: 8 }} onClick={e => e.stopPropagation()}>
                          {item.chipKey === 'archived' ? (
                            <button
                              title="Delete permanently"
                              onClick={async (e) => { e.stopPropagation(); try { await bookingsApi.destroy(item._key); } catch (_) {} refresh(); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 4, display: 'flex', borderRadius: 4 }}
                            >
                              <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                            </button>
                          ) : (
                            <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)', display: 'block' }} />
                          )}
                        </td>
                      </tr>

                      {/* Progress row */}
                      {showProgress && (
                        <tr>
                          <td colSpan={9} style={{ padding: 0, borderBottom: '1px solid var(--ion-border-color)' }}>
                            <div style={{ padding: '0 24px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                              {item._tab === 'in_progress'
                                ? <TmsProgress tmsStatus={item.tmsStatus} />
                                : <span style={{ display: 'block', padding: '10px 0', fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>No progress tracking for this load</span>
                              }
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Find Loads button */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', flexShrink: 0 }}>
        <button onClick={() => navigate('/carrier/loads')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 16px rgba(0,0,0,0.22)' }}>
          <IonIcon name="search-outline" style={{ fontSize: 17 }} /> Find Loads
        </button>
      </div>

    </div>

    <FilterDrawer
      open={filterOpen}
      onClose={() => setFilterOpen(false)}
      filters={filters}
      onChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
      onApply={() => { setApplied({ ...filters }); setFilterOpen(false); }}
      onClear={() => { setFilters({}); setApplied({}); setFilterOpen(false); }}
    />

    </div>
    </>
  );
}
