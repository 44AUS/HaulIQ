import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, TrafficLayer } from '@react-google-maps/api';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { calendarApi, driversApi } from '../../services/api';
import { IonButton, IonActionSheet, IonPopover, IonList, IonItem, IonLabel, IonCheckbox, IonAvatar } from '@ionic/react';
import IonIcon from '../../components/IonIcon';

const GMAPS_LIBS = ['places'];
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const STATUS_COLORS = {
  Unassigned:    { bg: '#9e9e9e', light: '#f5f5f5', text: '#616161' },
  Pending:       { bg: '#9e9e9e', light: '#f5f5f5', text: '#616161' },
  Scheduled:     { bg: '#2a7fff', light: '#e3f0ff', text: '#1558cc' },
  'In Progress': { bg: '#ffce00', light: '#fff8e1', text: '#000000' },
  Completed:     { bg: '#2dd36f', light: '#e6faf0', text: '#1a8c47' },
};

const VIEW_OPTIONS  = [
  { value: 'month',  label: 'Month'  },
  { value: 'week',   label: 'Week'   },
  { value: 'day',    label: 'Day'    },
  { value: 'agenda', label: 'Agenda' },
  { value: 'map',    label: 'Map'    },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_FILTER_OPTIONS = ['All', 'Pending', 'Scheduled', 'In Progress', 'Completed'];

function nthWeekday(year, month, weekday, n) {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday && ++count === n) return date;
  }
}
function lastWeekday(year, month, weekday) {
  let last;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) last = date;
  }
  return last;
}
function getHolidaysForYear(year) {
  return [
    { name: "New Year's Day",            date: new Date(year, 0, 1) },
    { name: 'Martin Luther King Jr. Day', date: nthWeekday(year, 0, 1, 3) },
    { name: "Presidents' Day",            date: nthWeekday(year, 1, 1, 3) },
    { name: 'Memorial Day',               date: lastWeekday(year, 4, 1) },
    { name: 'Juneteenth',                 date: new Date(year, 5, 19) },
    { name: 'Independence Day',           date: new Date(year, 6, 4) },
    { name: 'Labor Day',                  date: nthWeekday(year, 8, 1, 1) },
    { name: 'Columbus Day',               date: nthWeekday(year, 9, 1, 2) },
    { name: 'Veterans Day',               date: new Date(year, 10, 11) },
    { name: 'Thanksgiving Day',           date: nthWeekday(year, 10, 4, 4) },
    { name: 'Christmas Day',              date: new Date(year, 11, 25) },
  ].map(h => ({ id: `holiday-${year}-${h.name}`, title: h.name, start: h.date, end: h.date, allDay: true, type: 'holiday' }));
}

function MonthPickerDropdown({ open, onClose, date, onSelect, anchorRef }) {
  const [pickerYear, setPickerYear] = useState(date.getFullYear());
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [open, anchorRef]);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target) && anchorRef.current && !anchorRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);
  if (!open) return null;
  return (
    <div ref={ref} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 10000, width: 248, backgroundColor: 'var(--ion-card-background)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <IonButton fill="clear" shape="round" size="small" onClick={() => setPickerYear(y => y - 1)}>
          <IonIcon slot="icon-only" name="chevron-back-outline" />
        </IonButton>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ion-text-color)' }}>{pickerYear}</span>
        <IonButton fill="clear" shape="round" size="small" onClick={() => setPickerYear(y => y + 1)}>
          <IonIcon slot="icon-only" name="chevron-forward-outline" />
        </IonButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {MONTH_NAMES.map((m, i) => {
          const isSelected = date.getMonth() === i && date.getFullYear() === pickerYear;
          return (
            <button key={m} onClick={() => { onSelect(new Date(pickerYear, i, 1)); onClose(); }}
              style={{ fontWeight: isSelected ? 700 : 400, backgroundColor: isSelected ? 'var(--ion-color-primary)' : 'transparent', color: isSelected ? '#fff' : 'var(--ion-text-color)', border: 'none', borderRadius: 8, padding: '7px 0', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssignedDropdown({ drivers, selectedDrivers, onApply }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const toggleAll = () => setPending([]);
  const toggle    = (id) => setPending(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allSel    = pending.length === 0;

  const selectedDriverObjs = drivers.filter(d => selectedDrivers.includes(d.id));

  return (
    <>
      <IonButton
        id="assigned-driver-trigger"
        size="small"
        onClick={() => { setPending(selectedDrivers); setOpen(true); }}
        style={{ '--background': selectedDrivers.length > 0 ? 'var(--ion-color-primary)' : 'rgba(255,255,255,0.1)', '--color': '#fff', '--border-color': 'transparent', '--padding-start': '10px', '--padding-end': '10px' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Assigned</span>
          {selectedDriverObjs.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {selectedDriverObjs.slice(0, 4).map((d, i) => {
                const name = d.full_name || 'D';
                return (
                  <span key={d.id} style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', border: '1.5px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', marginLeft: i === 0 ? 0 : 4, overflow: 'hidden', flexShrink: 0 }}>
                    {d.avatar_url
                      ? <img src={d.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : name[0]?.toUpperCase()
                    }
                  </span>
                );
              })}
              {selectedDriverObjs.length > 4 && (
                <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff', marginLeft: 4, flexShrink: 0 }}>
                  +{selectedDriverObjs.length - 4}
                </span>
              )}
            </span>
          )}
          <IonIcon name="chevron-down-outline" style={{ fontSize: 13 }} />
        </span>
      </IonButton>

      <IonPopover
        trigger="assigned-driver-trigger"
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
        style={{ '--width': '280px', '--border-radius': '12px' }}
      >
        <IonList lines="none" style={{ paddingTop: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ion-text-color)' }}>Assigned</span>
            <IonButton size="small" color="success" onClick={() => { onApply(pending); setOpen(false); }}>APPLY</IonButton>
          </div>

          {/* All option */}
          <IonItem button detail={false} onClick={toggleAll} style={{ '--padding-start': '16px', '--padding-end': '16px', '--inner-padding-end': '0' }}>
            <IonCheckbox slot="start" checked={allSel} onIonChange={toggleAll} style={{ marginRight: 12 }} />
            <IonLabel style={{ fontSize: '0.9rem' }}>All Drivers</IonLabel>
          </IonItem>

          {/* Driver list */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {drivers.map(d => {
              const checked = pending.includes(d.id);
              const name = d.full_name || 'Driver';
              return (
                <IonItem key={d.id} button detail={false} onClick={() => toggle(d.id)} style={{ '--padding-start': '16px', '--padding-end': '16px', '--inner-padding-end': '0', '--min-height': '56px' }}>
                  <IonCheckbox slot="start" checked={checked} onIonChange={() => toggle(d.id)} style={{ marginRight: 12 }} />
                  <IonLabel style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</IonLabel>
                  <IonAvatar slot="end" style={{ width: 40, height: 40, marginLeft: 12, flexShrink: 0 }}>
                    {d.avatar_url
                      ? <img src={d.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                          {name[0]?.toUpperCase()}
                        </div>
                    }
                  </IonAvatar>
                </IonItem>
              );
            })}
            {drivers.length === 0 && (
              <IonItem style={{ '--padding-start': '16px' }}>
                <IonLabel style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>No drivers assigned</IonLabel>
              </IonItem>
            )}
          </div>
        </IonList>
      </IonPopover>
    </>
  );
}

function CalendarFilterDrawer({ open, onClose, filters, onChange, onApply, onClear, isDark }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}
      <div style={{ position: 'fixed', top: 0, right: open ? 0 : -280, bottom: 0, width: 280, zIndex: 200, backgroundColor: isDark ? '#1a1a1a' : '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)', transition: 'right 0.25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ion-text-color)' }}>Filter</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <IonButton fill="clear" color="danger" size="small" onClick={onClear}>CLEAR</IonButton>
            <IonButton size="small" onClick={onApply} style={{ '--background': 'var(--ion-color-primary)' }}>APPLY</IonButton>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '10px 20px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STATUS_FILTER_OPTIONS.map(s => (
                <div key={s} onClick={() => onChange('status', s)}
                  style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backgroundColor: filters.status === s ? 'rgba(0,0,0,0.07)' : 'transparent' }}
                  onMouseEnter={e => { if (filters.status !== s) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={e => { if (filters.status !== s) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <input type="checkbox" checked={filters.status === s} onChange={() => onChange('status', s)} onClick={e => e.stopPropagation()} style={{ margin: 0 }} readOnly />
                  <span style={{ fontSize: '0.875rem', fontWeight: filters.status === s ? 700 : 400, color: 'var(--ion-text-color)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVT_H   = 20;
const EVT_GAP = 3;
const DAY_NUM_H = 34;

function processWeekSpans(week, allEvents) {
  const weekStart = new Date(week[0]); weekStart.setHours(0, 0, 0, 0);
  const weekEnd   = new Date(week[6]); weekEnd.setHours(23, 59, 59, 999);
  const overlapping = allEvents
    .filter(evt => {
      const s = new Date(evt.start); s.setHours(0, 0, 0, 0);
      const e = new Date(evt.end || evt.start); e.setHours(23, 59, 59, 999);
      return s <= weekEnd && e >= weekStart;
    })
    .sort((a, b) => {
      const diff = new Date(a.start) - new Date(b.start);
      if (diff !== 0) return diff;
      return (new Date(b.end || b.start) - new Date(b.start)) - (new Date(a.end || a.start) - new Date(a.start));
    });
  const slotRanges = [];
  return overlapping.map(evt => {
    const s = new Date(evt.start); s.setHours(0, 0, 0, 0);
    const e = new Date(evt.end || evt.start); e.setHours(23, 59, 59, 999);
    const colStart = s < weekStart ? 0 : (() => {
      const idx = week.findIndex(d => { const wd = new Date(d); wd.setHours(0, 0, 0, 0); return wd.getTime() === s.getTime(); });
      return idx === -1 ? 0 : idx;
    })();
    const colEnd = e > weekEnd ? 6 : (() => {
      let last = colStart;
      for (let i = 0; i < 7; i++) { const wd = new Date(week[i]); wd.setHours(0, 0, 0, 0); if (wd <= e) last = i; }
      return last;
    })();
    let slot = 0;
    while (true) {
      const ranges = slotRanges[slot] || [];
      if (!ranges.some(r => !(r.colEnd < colStart || r.colStart > colEnd))) break;
      slot++;
    }
    if (!slotRanges[slot]) slotRanges[slot] = [];
    slotRanges[slot].push({ colStart, colEnd });
    return { evt, colStart, colEnd, slot, startsThisWeek: s >= weekStart, endsThisWeek: e <= weekEnd };
  });
}

function MonthGrid({ date, allEvents, onSelectEvent, onDayClick, isDark, brandColor }) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const cur = new Date(first);
    cur.setDate(cur.getDate() - cur.getDay());
    const rows = [];
    for (let w = 0; w < 6; w++) {
      rows.push(Array.from({ length: 7 }, () => { const d = new Date(cur); cur.setDate(cur.getDate() + 1); return d; }));
    }
    return rows;
  }, [year, month]);
  const today   = new Date();
  const isToday = d => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 920 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
        {DAY_HEADERS.map(h => (
          <div key={h} style={{ padding: '10px 0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ion-color-medium)', letterSpacing: '0.05em' }}>{h}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(6, 1fr)' }}>
        {weeks.map((week, wi) => {
          const spans = processWeekSpans(week, allEvents);
          const maxSlot = spans.length > 0 ? Math.max(...spans.map(s => s.slot)) : -1;
          const eventsAreaH = maxSlot >= 0 ? DAY_NUM_H + (maxSlot + 1) * (EVT_H + EVT_GAP) : DAY_NUM_H;
          return (
            <div key={wi} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < 5 ? '1px solid var(--ion-border-color)' : 'none' }}>
              {week.map((day, di) => {
                const inMonth   = day.getMonth() === month;
                const todayCell = isToday(day);
                return (
                  <div key={di} style={{ paddingTop: 6, paddingLeft: 8, paddingRight: 8, paddingBottom: Math.max(eventsAreaH - DAY_NUM_H + 8, 8), borderRight: di < 6 ? '1px solid var(--ion-border-color)' : 'none', backgroundColor: !inMonth ? (isDark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.025)') : 'transparent', minHeight: 100 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div onClick={() => onDayClick(day)} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', backgroundColor: todayCell ? (brandColor || 'var(--ion-color-primary)') : 'transparent' }}
                        onMouseEnter={e => { if (!todayCell) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.07)'; }}
                        onMouseLeave={e => { if (!todayCell) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: todayCell ? 800 : inMonth ? 500 : 400, color: todayCell ? '#fff' : inMonth ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', lineHeight: 1, userSelect: 'none' }}>
                          {day.getDate()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {spans.map(({ evt, colStart, colEnd, slot, startsThisWeek, endsThisWeek }) => {
                const isHoliday = evt.type === 'holiday';
                const statusColor = STATUS_COLORS[evt.status] || STATUS_COLORS.Pending;
                const bg = isHoliday ? (brandColor || 'var(--ion-color-primary)') : statusColor.bg;
                const textColor = isHoliday ? '#fff' : statusColor.text;
                const top   = DAY_NUM_H + slot * (EVT_H + EVT_GAP);
                const lPad  = startsThisWeek ? 3 : 0;
                const rPad  = endsThisWeek   ? 3 : 0;
                const rLeft = startsThisWeek ? 4 : 0;
                const rRight= endsThisWeek   ? 4 : 0;
                return (
                  <div key={`${evt.id}-w${wi}`}
                    onClick={() => !isHoliday && onSelectEvent(evt)}
                    style={{ position: 'absolute', top, left: `calc(${colStart * (100 / 7)}% + ${lPad}px)`, width: `calc(${(colEnd - colStart + 1) * (100 / 7)}% - ${lPad + rPad}px)`, height: EVT_H, backgroundColor: bg, color: textColor, borderRadius: `${rLeft}px ${rRight}px ${rRight}px ${rLeft}px`, fontSize: '0.68rem', fontWeight: 600, padding: '0 6px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', cursor: isHoliday ? 'default' : 'pointer', opacity: isHoliday ? 0.82 : 1, zIndex: 1 }}>
                    {(startsThisWeek || colStart === 0) && evt.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MAP_LAYERS = [
  { key: 'satellite', label: 'Satellite',    icon: 'globe-outline' },
  { key: 'traffic',   label: 'Live Traffic', icon: 'car-outline' },
];

function MapLayersPanel({ pending, onToggle, onApply, isDark }) {
  const bg = isDark ? '#2a2a2a' : '#fff';
  const textCol = isDark ? '#fff' : '#0D1B2A';
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  return (
    <div style={{ position: 'absolute', top: 'calc(44px + 10px)', left: 10, zIndex: 10, width: 260, backgroundColor: bg, borderRadius: 10, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.55)' : '0 4px 24px rgba(0,0,0,0.18)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
        <span style={{ color: textCol, fontWeight: 700, fontSize: '1.1rem' }}>Layers</span>
        <IonButton size="small" onClick={onApply} style={{ '--background': 'var(--ion-color-primary)' }}>APPLY</IonButton>
      </div>
      {MAP_LAYERS.map(({ key, label, icon }, i) => (
        <div key={key} onClick={() => onToggle(key)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderTop: i > 0 ? `1px solid ${divider}` : 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <input type="checkbox" checked={pending[key]} onChange={() => onToggle(key)} onClick={e => e.stopPropagation()} style={{ margin: 0, accentColor: '#2dd36f', width: 18, height: 18 }} />
          <span style={{ color: textCol, fontWeight: 500, fontSize: '1rem', flex: 1 }}>{label}</span>
          <IonIcon name={icon} style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)', fontSize: 20 }} />
        </div>
      ))}
      <div style={{ height: 6 }} />
    </div>
  );
}

function MapView({ events, mapsLoaded, mapMarker, setMapMarker, isDark }) {
  const [layersOpen, setLayersOpen] = useState(false);
  const [pending, setPending] = useState({ satellite: false, traffic: false });
  const [applied, setApplied] = useState({ satellite: false, traffic: false });
  const mapEvents = events.filter(e => e.pickup_lat && e.pickup_lng);
  const center = mapEvents.length > 0 ? { lat: mapEvents[0].pickup_lat, lng: mapEvents[0].pickup_lng } : { lat: 39.5, lng: -98.35 };
  const handleToggle = (key) => setPending(p => ({ ...p, [key]: !p[key] }));
  const handleApply  = () => { setApplied({ ...pending }); setLayersOpen(false); };
  if (!mapsLoaded) return <div style={{ height: 920, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'var(--ion-color-medium)' }}>Loading map...</span></div>;
  return (
    <div style={{ position: 'relative', width: '100%', height: 920 }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <div onClick={() => { setPending({ ...applied }); setLayersOpen(o => !o); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, borderRadius: 8, backgroundColor: isDark ? (layersOpen ? '#333' : '#2a2a2a') : (layersOpen ? '#f0f0f0' : '#fff'), boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.16)', cursor: 'pointer', userSelect: 'none' }}>
          <IonIcon name="layers-outline" style={{ fontSize: 16, color: layersOpen ? '#2dd36f' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: layersOpen ? '#2dd36f' : isDark ? '#fff' : '#0D1B2A' }}>Layers</span>
        </div>
      </div>
      {layersOpen && <MapLayersPanel pending={pending} onToggle={handleToggle} onApply={handleApply} isDark={isDark} />}
      {layersOpen && <div style={{ position: 'absolute', inset: 0, zIndex: 9 }} onClick={() => setLayersOpen(false)} />}
      <GoogleMap mapContainerStyle={{ width: '100%', height: 920 }} center={center} zoom={mapEvents.length > 0 ? 5 : 4} mapTypeId={applied.satellite ? 'hybrid' : 'roadmap'} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}>
        {applied.traffic && <TrafficLayer />}
        {mapEvents.map(event => {
          const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
          return [
            <Marker key={`pickup-${event.id}`} position={{ lat: event.pickup_lat, lng: event.pickup_lng }} onClick={() => setMapMarker({ event, type: 'pickup' })}
              icon={{ url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 28 36'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z' fill='${encodeURIComponent(c.bg)}'/><circle cx='14' cy='14' r='6' fill='white'/></svg>`, scaledSize: { width: 28, height: 36 }, anchor: { x: 14, y: 36 } }}
            />,
            event.delivery_lat && event.delivery_lng ? (
              <Marker key={`delivery-${event.id}`} position={{ lat: event.delivery_lat, lng: event.delivery_lng }} onClick={() => setMapMarker({ event, type: 'delivery' })}
                icon={{ url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='30' viewBox='0 0 28 36'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z' fill='white' stroke='${encodeURIComponent(c.bg)}' stroke-width='3'/><circle cx='14' cy='14' r='5' fill='${encodeURIComponent(c.bg)}'/></svg>`, scaledSize: { width: 24, height: 30 }, anchor: { x: 12, y: 30 } }}
              />
            ) : null,
          ];
        })}
        {mapMarker && (
          <InfoWindow
            position={mapMarker.type === 'pickup' ? { lat: mapMarker.event.pickup_lat, lng: mapMarker.event.pickup_lng } : { lat: mapMarker.event.delivery_lat, lng: mapMarker.event.delivery_lng }}
            onCloseClick={() => setMapMarker(null)}>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>{mapMarker.type === 'pickup' ? 'Pickup' : 'Delivery'}</div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{mapMarker.event.origin} → {mapMarker.event.destination}</div>
              <div style={{ fontWeight: 700, color: '#2dd36f', marginTop: 4 }}>${mapMarker.event.rate?.toLocaleString()}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ backgroundColor: (STATUS_COLORS[mapMarker.event.status] || STATUS_COLORS.Pending).bg, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600 }}>{mapMarker.event.status}</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default function CalendarPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { isDark, brandColor } = useThemeMode();

  const [view, setView]           = useState('month');
  const [date, setDate]           = useState(new Date());
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [mapMarker, setMapMarker] = useState(null);
  const [drivers, setDrivers]     = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [findLoadsSheet, setFindLoadsSheet] = useState(false);
  const [filters, setFilters]     = useState({ status: 'All' });
  const [appliedFilters, setAppliedFilters] = useState({ status: 'All' });
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerAnchorRef = useRef(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '', libraries: GMAPS_LIBS });

  const loadEvents = useCallback(() => {
    setLoading(true);
    calendarApi.events()
      .then(data => {
        setEvents((Array.isArray(data) ? data : []).filter(e => e.start).map(e => ({ ...e, start: new Date(e.start), end: e.end ? new Date(e.end) : new Date(e.start) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (user?.role === 'carrier') driversApi.list().then(d => setDrivers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [user?.role]);

  const holidays = useMemo(() => {
    const y = date.getFullYear();
    return [y - 1, y, y + 1, y + 2].flatMap(getHolidaysForYear);
  }, [date.getFullYear()]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEvents = useMemo(() => {
    let evts = events;
    if (selectedDrivers.length > 0) evts = evts.filter(e => selectedDrivers.includes(e.driver_id));
    if (appliedFilters.status && appliedFilters.status !== 'All') evts = evts.filter(e => e.status === appliedFilters.status);
    return evts;
  }, [events, selectedDrivers, appliedFilters]);

  const allEvents = useMemo(() => [...filteredEvents, ...holidays], [filteredEvents, holidays]);

  const monthRevenue = useMemo(() => {
    const y = date.getFullYear(), m = date.getMonth();
    return filteredEvents.filter(e => { const s = new Date(e.start); return s.getFullYear() === y && s.getMonth() === m && e.status === 'Completed'; }).reduce((sum, e) => sum + (Number(e.rate) || 0), 0);
  }, [filteredEvents, date]);

  const handleEventClick = useCallback((event) => {
    if (event.type === 'holiday') return;
    const path = user?.role === 'carrier'
      ? (event.booking_id ? `/carrier/active/${event.booking_id}` : `/carrier/loads/${event.load_id}`)
      : `/broker/loads/${event.load_id}`;
    navigate(path);
  }, [user?.role, navigate]);

  const handleDayClick = useCallback((day) => { setDate(day); setView('day'); }, []);

  const prev = () => {
    if (view === 'month' || view === 'agenda') setDate(d => subMonths(d, 1));
    else if (view === 'week') setDate(d => subWeeks(d, 1));
    else setDate(d => subDays(d, 1));
  };
  const next = () => {
    if (view === 'month' || view === 'agenda') setDate(d => addMonths(d, 1));
    else if (view === 'week') setDate(d => addWeeks(d, 1));
    else setDate(d => addDays(d, 1));
  };

  const primary = brandColor || '#1565C0';
  const eventPropGetter = useCallback((event) => {
    if (event.type === 'holiday') return { style: { backgroundColor: primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600, padding: '2px 8px', cursor: 'default', opacity: 0.85 } };
    const c = STATUS_COLORS[event.status] || STATUS_COLORS.Pending;
    return { style: { backgroundColor: c.bg, color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600, padding: '2px 8px', cursor: 'pointer' } };
  }, [primary]);

  const calSx = {
    '--rbc-color': 'var(--ion-text-color)',
    '--rbc-bg': 'var(--ion-card-background)',
    '--rbc-border': 'var(--ion-border-color)',
  };

  const calStyle = {
    '& .rbc-toolbar': { display: 'none' },
    color: 'var(--ion-text-color)',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ padding: '4px 6px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', backgroundColor: 'var(--ion-card-background)', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Row 1: month picker + view toggle | filter */}
        <style>{`@media (max-width: 768px) { .cal-toprow-scroll { overflow-x: auto; scrollbar-width: thin; } }`}</style>
        <div className="cal-toprow-scroll" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', minWidth: 'max-content', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }} ref={pickerAnchorRef}>
                <IonButton fill="clear" onClick={() => setPickerOpen(o => !o)} style={{ fontWeight: 700, fontSize: '1rem', '--color': 'var(--ion-text-color)' }}>
                  {MONTH_FULL[date.getMonth()]} {date.getFullYear()}
                  <IonIcon slot="end" name="chevron-down-outline" />
                </IonButton>
                <MonthPickerDropdown open={pickerOpen} onClose={() => setPickerOpen(false)} date={date} onSelect={d => { setDate(d); setView('month'); }} anchorRef={pickerAnchorRef} />
              </div>

              <div style={{ display: 'flex', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: 10, padding: 3, gap: 2 }}>
                {VIEW_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setView(value)}
                    style={{ background: view === value ? 'var(--ion-card-background)' : 'transparent', color: view === value ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', fontFamily: 'inherit', boxShadow: view === value ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <IonButton size="small" color="dark" fill="solid" onClick={() => setFilterOpen(true)} style={{ flexShrink: 0 }}>
              <IonIcon slot="start" name="funnel-outline" /> Filter
            </IonButton>
          </div>
        </div>

        {/* Row 2: nav + assigned + revenue */}
        <div className="cal-toprow-scroll" style={{ flexShrink: 0, borderBottom: '1px solid var(--ion-border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', minWidth: 'max-content', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonButton fill="clear" shape="round" size="small" onClick={prev}>
                <IonIcon slot="icon-only" name="chevron-back-outline" />
              </IonButton>
              <IonButton fill="clear" size="small" onClick={() => setDate(new Date())}>Today</IonButton>
              <IonButton fill="clear" shape="round" size="small" onClick={next}>
                <IonIcon slot="icon-only" name="chevron-forward-outline" />
              </IonButton>
              {user?.role === 'carrier' && <AssignedDropdown drivers={drivers} selectedDrivers={selectedDrivers} onApply={setSelectedDrivers} />}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ion-text-color)', lineHeight: 1.3 }}>{MONTH_FULL[date.getMonth()]}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2dd36f', lineHeight: 1.2 }}>${monthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* Calendar content */}
        {loading ? (
          <div style={{ flex: 1, padding: 24 }}><div style={{ height: '100%', borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} /></div>
        ) : view === 'map' ? (
          <div style={{ flex: 1, overflow: 'hidden' }}><MapView events={filteredEvents} mapsLoaded={mapsLoaded} mapMarker={mapMarker} setMapMarker={setMapMarker} isDark={isDark} /></div>
        ) : view === 'month' ? (
          <div style={{ flex: 1, overflow: 'hidden' }}><MonthGrid date={date} allEvents={allEvents} onSelectEvent={handleEventClick} onDayClick={handleDayClick} isDark={isDark} brandColor={primary} /></div>
        ) : (
          <div style={{ ...calSx, ...calStyle, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <style>{`
              .rbc-toolbar { display: none !important; }
              .rbc-calendar { color: var(--ion-text-color); font-family: inherit; height: 100% !important; }
              .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 0 !important; }
              .rbc-header { border-bottom: 1px solid var(--ion-border-color) !important; padding: 10px !important; font-weight: 600; font-size: 0.78rem; color: var(--ion-color-medium); background: var(--ion-card-background); }
              .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--ion-border-color) !important; }
              .rbc-month-row + .rbc-month-row { border-top: 1px solid var(--ion-border-color) !important; }
              .rbc-event { border-radius: 6px !important; outline: none !important; }
              .rbc-event.rbc-selected { outline: none !important; filter: brightness(0.88); }
              .rbc-show-more { color: var(--ion-color-primary); font-weight: 600; font-size: 0.73rem; background: transparent; border: 0; cursor: pointer; padding-left: 4px; }
              .rbc-time-content { border-top: 1px solid var(--ion-border-color) !important; }
              .rbc-timeslot-group { border-bottom: 1px solid var(--ion-border-color) !important; }
              .rbc-time-slot { color: var(--ion-color-medium); font-size: 0.72rem; }
              .rbc-agenda-view table { width: 100%; border-collapse: collapse; }
              .rbc-agenda-view table thead th { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--ion-border-color); font-weight: 700; font-size: 0.75rem; color: var(--ion-color-medium); background: var(--ion-card-background); }
              .rbc-agenda-view table tbody tr { border-bottom: 1px solid var(--ion-border-color); }
              .rbc-agenda-view table tbody td { padding: 10px 12px; font-size: 0.82rem; }
              .rbc-agenda-date-cell { font-weight: 700; white-space: nowrap; }
              .rbc-agenda-time-cell { color: var(--ion-color-medium); white-space: nowrap; }
            `}</style>
            <Calendar
              localizer={localizer}
              events={allEvents}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={setView}
              eventPropGetter={eventPropGetter}
              onSelectEvent={handleEventClick}
              style={{ flex: 1, height: '100%' }}
              popup
            />
          </div>
        )}
      </div>

      <CalendarFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onApply={() => { setAppliedFilters({ ...filters }); setFilterOpen(false); }}
        onClear={() => { setFilters({ status: 'All' }); setAppliedFilters({ status: 'All' }); setFilterOpen(false); }}
        isDark={isDark}
      />

      {user?.role === 'carrier' && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <IonButton onClick={() => setFindLoadsSheet(true)} style={{ '--background': primary, '--background-activated': primary, '--background-hover': primary, '--border-color': primary, '--box-shadow': '0 6px 20px rgba(0,0,0,0.3)' }}>
            <IonIcon slot="start" name="search-outline" /> Find Loads
          </IonButton>
        </div>
      )}

      <IonActionSheet
        isOpen={findLoadsSheet}
        onDidDismiss={() => setFindLoadsSheet(false)}
        header="Find Loads"
        buttons={[
          {
            text: 'Browse Load Board',
            icon: 'albums-outline',
            handler: () => navigate('/carrier/loads'),
          },
          {
            text: 'Lane Watches',
            icon: 'eye-outline',
            handler: () => navigate('/carrier/lane-watches'),
          },
          {
            text: 'Cancel',
            role: 'cancel',
            icon: 'close-outline',
          },
        ]}
      />
    </div>
  );
}
