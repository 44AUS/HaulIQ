import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonMenuButton,
  IonBadge, IonList, IonItem, IonLabel,
  IonToggle, IonSkeletonText, IonPopover, IonSearchbar,
} from '@ionic/react';
import IonIcon from '../IonIcon';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { searchApi, notificationsApi } from '../../services/api';

const DEFAULT_BAR_COLOR = '#1565C0';
const NOTIF_DRAWER_WIDTH = 360;

// ── Role nav configs ──────────────────────────────────────────────────────────
const CARRIER_NAV = [
  { icon: 'calendar-outline',   label: 'Calendar',     path: '/carrier/calendar' },
  { icon: 'search-outline',     label: 'Load Board',   path: '/carrier/loads' },
  { icon: 'layers-outline',     label: 'Loads',        path: '/carrier/job-manager' },
  { icon: 'cash-outline',       label: 'Payments',     path: '/carrier/payments' },
  { icon: 'bus-outline',        label: 'My Equipment', path: '/carrier/equipment' },
  { icon: 'eye-outline',        label: 'Lane Watch',   path: '/carrier/lane-watches' },
];
const BROKER_NAV = [
  { icon: 'calendar-outline',   label: 'Calendar',  path: '/broker/calendar' },
  { icon: 'add-circle-outline', label: 'Post Load', path: '/broker/post' },
  { icon: 'cube-outline',       label: 'Loads',     path: '/broker/loads' },
  { icon: 'calendar-outline',   label: 'Bookings',  path: '/broker/bookings' },
  { icon: 'card-outline',       label: 'Payments',  path: '/broker/payments' },
  { icon: 'car-sport-outline',  label: 'Trucks',    path: '/broker/trucks' },
];
const DRIVER_NAV = [
  { icon: 'car-sport-outline',  label: 'My Loads', path: '/driver/loads' },
  { icon: 'wallet-outline',     label: 'Earnings', path: '/driver/earnings' },
  { icon: 'chatbubble-outline', label: 'Messages', path: '/driver/messages' },
];
const ADMIN_NAV = [
  { icon: 'grid-outline',      label: 'Overview',  path: '/admin' },
  { icon: 'people-outline',    label: 'Users',     path: '/admin/users' },
  { icon: 'cube-outline',      label: 'Loads',     path: '/admin/loads' },
  { icon: 'cash-outline',      label: 'Revenue',   path: '/admin/revenue' },
  { icon: 'card-outline',      label: 'Payments',  path: '/admin/payments' },
  { icon: 'list-outline',      label: 'Waitlist',  path: '/admin/waitlist' },
  { icon: 'layers-outline',    label: 'Plans',     path: '/admin/plans' },
  { icon: 'car-sport-outline', label: 'Equipment', path: '/admin/equipment' },
  { icon: 'grid-outline',      label: 'Classes',        path: '/admin/equipment-classes' },
  { icon: 'settings-outline',  label: 'App Settings',   path: '/admin/app-settings' },
];

// ── Immersive mode config ─────────────────────────────────────────────────────
const IMMERSIVE_CONFIG = {
  network:        { title: 'Network',         tabs: [{ key: 'connections', label: 'Connections' }, { key: 'know', label: 'People You May Know' }] },
  billing:        { title: 'Billing',         tabs: [{ key: 'plans', label: 'Subscription Plans' }, { key: 'referrals', label: 'Referrals' }] },
  messages:       { title: 'Message Center',  tabs: [] },
  analytics:      { title: 'Analytics',       tabs: [{ key: 'loads', label: 'Loads' }, { key: 'payments', label: 'Payments' }, { key: 'drivers', label: 'Drivers' }, { key: 'imports', label: 'Imports' }] },
  tools:          { title: 'Tools',           tabs: [{ key: 'brain', label: 'Earnings Brain' }, { key: 'calculator', label: 'Profit Calculator' }] },
  drivers:        { title: 'My Drivers',      tabs: [] },
  preferences:    { title: 'Preferences',     tabs: [{ key: 'all', label: 'All' }, { key: 'branding', label: 'Branding' }, { key: 'notifications', label: 'Notifications' }, { key: 'equipment', label: 'Equipment' }, { key: 'documents', label: 'Documents' }, { key: 'billing', label: 'Billing' }, { key: 'privacy', label: 'Privacy' }, { key: 'security', label: 'Security' }, { key: 'support', label: 'Support' }] },
  business:       { title: 'Manage Business', tabs: [{ key: 'overview', label: 'Overview' }, { key: 'metadata', label: 'Metadata' }] },
  profile:        { title: 'Manage Profile',  tabs: [{ key: 'overview', label: 'Overview' }, { key: 'earnings', label: 'Earnings' }, { key: 'documents', label: 'Documents' }, { key: 'businesses', label: 'Businesses' }, { key: 'time_off', label: 'Time Off' }, { key: 'metadata', label: 'Metadata' }] },
  load_detail:    { title: 'Load Details',    tabs: [{ key: 'overview', label: 'Overview' }, { key: 'payments', label: 'Payments' }, { key: 'documents', label: 'Documents' }], messageMode: true },
  carrier_profile:{ title: 'Carrier Profile', tabs: [{ key: 'overview', label: 'Overview' }, { key: 'reviews', label: 'Reviews' }] },
  broker_profile: { title: 'Broker Profile',  tabs: [{ key: 'overview', label: 'Overview' }, { key: 'reviews', label: 'Reviews' }, { key: 'pay_speed', label: 'Pay Speed' }] },
  settings:       { title: 'Settings',        tabs: [] },
};

// ── Notification helpers ──────────────────────────────────────────────────────
const NOTIF_PREF_CATEGORIES = [
  { key: 'loads',      label: 'Loads',      desc: 'Notified when a bid is placed or accepted on a load', items: [{ key: 'new_bid', label: 'New Bids' }, { key: 'bid_accepted', label: 'Bid Accepted' }] },
  { key: 'bookings',   label: 'Bookings',   desc: 'Notified when a booking is requested, approved, or denied', items: [{ key: 'new_booking_request', label: 'Booking Requests' }, { key: 'booking_approved', label: 'Booking Approved' }, { key: 'booking_denied', label: 'Booking Denied' }] },
  { key: 'lane_watch', label: 'Lane Watch', desc: 'Notified when a lane watch match is found', items: [{ key: 'lane_watch_match', label: 'Lane Watch Matches' }] },
  { key: 'system',     label: 'System',     desc: 'TMS updates and platform notifications', items: [{ key: 'tms_update', label: 'TMS Updates' }] },
];
const PREF_STORAGE_KEY = 'hauliq_notif_prefs';
const loadPrefs  = () => { try { return JSON.parse(localStorage.getItem(PREF_STORAGE_KEY) || '{}'); } catch { return {}; } };
const savePrefs  = (p) => localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(p));

function notifPath(notif, role) {
  const d = notif.data || {};
  if (notif.type === 'new_bid' || notif.type === 'new_booking_request') return d.load_id ? `/${role}/loads/${d.load_id}` : `/${role}/loads`;
  if (notif.type === 'bid_accepted' || notif.type === 'booking_approved') return `/${role}/active`;
  if (notif.type === 'lane_watch_match') return d.load_id ? `/carrier/loads/${d.load_id}` : '/carrier/loads';
  return `/${role}/dashboard`;
}

function formatTime(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Search results panel ──────────────────────────────────────────────────────
const SEARCH_CATS = [
  { key: 'connections',       label: 'Connections',       icon: 'person-outline' },
  { key: 'messages',          label: 'Messages',          icon: 'chatbubble-outline' },
  { key: 'loads_in_progress', label: 'Loads In Progress', icon: 'car-sport-outline' },
  { key: 'completed_loads',   label: 'Completed Loads',   icon: 'checkmark-circle-outline' },
  { key: 'saved_loads',       label: 'Saved Loads',       icon: 'bookmark-outline' },
  { key: 'payments',          label: 'Payments',          icon: 'cash-outline' },
];

function SearchPanel({ results, loading, onNavigate }) {
  if (loading) return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <IonSkeletonText animated style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <IonSkeletonText animated style={{ width: '60%', height: 16 }} />
            <IonSkeletonText animated style={{ width: '40%', height: 13, marginTop: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );

  const hasAny = SEARCH_CATS.some(c => (results?.[c.key] || []).length > 0);
  if (!hasAny) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No results found</div>
  );

  return (
    <div style={{ maxHeight: 480, overflowY: 'auto', padding: '8px 0' }}>
      {SEARCH_CATS.map(({ key, label, icon }) => {
        const items = results?.[key] || [];
        if (!items.length) return null;
        return (
          <div key={key}>
            <div style={{ padding: '6px 16px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ion-color-step-400)' }}>{label}</div>
            {items.map(item => (
              <div key={item.id} onClick={() => onNavigate(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', cursor: 'pointer' }} className="search-result-row">
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.85 }}>
                  <IonIcon name={icon} style={{ fontSize: 14, color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {key === 'connections' ? item.name : key === 'messages' ? `${item.other_name}: ${item.body}` : `${item.origin} → ${item.destination}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {key === 'connections' ? (item.company || item.role) : key === 'messages' ? 'Message' : key === 'payments' ? `$${item.amount?.toFixed(2)} · ${item.status}` : `${item.commodity || ''} · $${item.rate?.toLocaleString()}`}
                  </div>
                </div>
              </div>
            ))}
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--ion-border-color)' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Notification panel ────────────────────────────────────────────────────────
function NotificationsPanel({ onClose, onCountChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showPrefs,  setShowPrefs]  = useState(false);
  const [prefs,      setPrefs]      = useState(loadPrefs);

  const load = () => {
    if (!user) return;
    notificationsApi.list()
      .then(data => {
        setNotifs(Array.isArray(data) ? data : []);
        const u = Array.isArray(data) ? data.filter(n => !n.read).length : 0;
        onCountChange?.(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const visibleNotifs = notifs.filter(n => prefs[n.type] !== false);

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead()
      .then(() => { setNotifs(prev => prev.map(n => ({ ...n, read: true }))); onCountChange?.(0); })
      .catch(() => {});
  };
  const handleDeleteAll = () => {
    notificationsApi.deleteAll().then(() => { setNotifs([]); onCountChange?.(0); }).catch(() => {});
  };
  const handleDelete = (id) => {
    notificationsApi.delete(id).catch(() => {});
    setNotifs(prev => {
      const next = prev.filter(n => n.id !== id);
      onCountChange?.(next.filter(n => !n.read).length);
      return next;
    });
  };
  const handleClick = (notif) => {
    if (!notif.read) {
      notificationsApi.markRead(notif.id).catch(() => {});
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    navigate(notifPath(notif, user.role));
    onClose();
  };

  if (showPrefs) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.15)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => { setShowPrefs(false); setPrefs(loadPrefs()); }}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <IonIcon name="arrow-back-outline" style={{ fontSize: 20, pointerEvents: 'none' }} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Notifications</span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IonIcon name="close-outline" style={{ fontSize: 20, pointerEvents: 'none' }} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 400, color: 'var(--ion-color-medium)', backgroundColor: 'var(--ion-background-color)', borderBottom: '1px solid var(--ion-border-color)' }}>Preferences</div>
          {NOTIF_PREF_CATEGORIES.map((cat) => (
            <div key={cat.key} style={{ borderBottom: '1px solid var(--ion-border-color)' }}>
              {cat.items.length === 1 ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 20px', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 400, fontSize: '0.875rem' }}>{cat.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginTop: 2 }}>{cat.desc}</div>
                  </div>
                  <IonToggle
                    size="small"
                    checked={prefs[cat.items[0].key] !== false}
                    onIonChange={() => {
                      setPrefs(prev => { const n = { ...prev, [cat.items[0].key]: !( prev[cat.items[0].key] !== false) }; savePrefs(n); return n; });
                    }}
                  />
                </div>
              ) : (
                <div style={{ padding: '12px 20px' }}>
                  <div style={{ fontWeight: 400, fontSize: '0.875rem', marginBottom: 2 }}>{cat.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginBottom: 8 }}>{cat.desc}</div>
                  {cat.items.map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{item.label}</span>
                      <IonToggle
                        size="small"
                        checked={prefs[item.key] !== false}
                        onIonChange={() => {
                          setPrefs(prev => { const n = { ...prev, [item.key]: !(prev[item.key] !== false) }; savePrefs(n); return n; });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: NOTIF_DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.15)', zIndex: 1 }}>
        <div style={{ paddingLeft: 8, fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Notifications</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setShowPrefs(true)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IonIcon name="funnel-outline" style={{ fontSize: 18, pointerEvents: 'none' }} />
          </button>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IonIcon name="close-outline" style={{ fontSize: 20, pointerEvents: 'none' }} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <IonSkeletonText animated style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <IonSkeletonText animated style={{ width: '75%', height: 18 }} />
                  <IonSkeletonText animated style={{ width: '50%', height: 14, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : visibleNotifs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <IonIcon name="checkmark-circle-outline" style={{ fontSize: 40, color: 'var(--ion-color-success)', marginBottom: 8 }} />
            <div style={{ fontWeight: 600 }}>All caught up!</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', marginTop: 4 }}>No notifications right now.</div>
          </div>
        ) : (
          visibleNotifs.map((notif, i) => (
            <div key={notif.id}>
              {i > 0 && <hr style={{ margin: 0, border: 'none', borderTop: '1px solid var(--ion-border-color)' }} />}
              <div
                onClick={() => handleClick(notif)}
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', backgroundColor: notif.read ? 'var(--ion-card-background)' : 'var(--ion-color-step-50)' }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  <IonIcon name="notifications-outline" style={{ fontSize: '1.25rem', color: 'var(--ion-color-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: notif.read ? 500 : 700, fontSize: '0.875rem', flex: 1, marginRight: 8 }}>{notif.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-step-300)', flexShrink: 0 }}>{formatTime(notif.created_at)}</span>
                  </div>
                  {notif.body && <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginTop: 2 }}>{notif.body}</div>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(notif.id); }}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(235,68,90,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <IonIcon name="trash-outline" style={{ fontSize: '1rem', pointerEvents: 'none' }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {!loading && notifs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <IonButton expand="block" size="small" onClick={handleMarkAllRead} style={{ flex: 1, '--background': '#fff', '--color': '#000', '--box-shadow': 'none' }}>
            <IonIcon name="checkmark-done-outline" slot="start" />
            Mark Read
          </IonButton>
          <IonButton expand="block" size="small" color="danger" onClick={handleDeleteAll} style={{ flex: 1 }}>
            <IonIcon name="trash-outline" slot="start" />
            Delete All
          </IonButton>
        </div>
      )}
    </div>
  );
}

// ── Desktop nav link ──────────────────────────────────────────────────────────
function NavLink({ item, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 7,
        padding: '0 20px', height: '100%', cursor: 'pointer', flexShrink: 0,
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        position: 'relative', userSelect: 'none', minWidth: 0,
        borderBottom: active ? '3px solid #fff' : '3px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      <IonIcon name={item.icon} style={{ fontSize: 18, flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
    </div>
  );
}

// ── Immersive tab ─────────────────────────────────────────────────────────────
function ImmersiveTab({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', cursor: 'pointer', position: 'relative',
        color: active ? '#fff' : 'rgba(255,255,255,0.60)',
        userSelect: 'none', letterSpacing: '0.08em', fontSize: 13,
        fontWeight: 700, textTransform: 'uppercase',
        borderBottom: active ? '3px solid #fff' : '3px solid transparent',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </div>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar({ onToggleSidebar, immersiveMode }) {
  const { user } = useAuth();
  const { brandColor, mode } = useThemeMode();
  const isDark = mode === 'dark';
  const barColor = brandColor || DEFAULT_BAR_COLOR;
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchVal,    setSearchVal]    = useState('');
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifCount,   setNotifCount]   = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tabMenuOpen,  setTabMenuOpen]  = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef    = useRef(null);
  const searchPanelRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchCount = () => notificationsApi.count().then(d => setNotifCount(d.unread || 0)).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchVal || searchVal.trim().length < 2) { setSearchResults(null); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      searchApi.search(searchVal.trim())
        .then(d => setSearchResults(d))
        .catch(() => setSearchResults(null))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [searchVal]);

  useEffect(() => {
    const h = (e) => { if (searchPanelRef.current && !searchPanelRef.current.contains(e.target)) setSearchResults(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleCloseSearch = () => { setSearchOpen(false); setSearchVal(''); setSearchResults(null); };

  if (!user) return null;

  const toolbarStyle = { '--background': barColor, '--color': '#ffffff', '--min-height': '60px', '--padding-start': '0', '--padding-end': '0' };

  // ── Immersive mode ──────────────────────────────────────────────────────────
  if (immersiveMode) {
    const config    = IMMERSIVE_CONFIG[immersiveMode];
    const displayTitle = immersiveMode === 'profile' && user?.name ? user.name
                       : immersiveMode === 'business' && user?.company ? user.company
                       : config.title;
    const hasTabs   = config.tabs.length > 0;
    const activeTab = searchParams.get('tab') || (hasTabs ? config.tabs[0].key : null);
    const setTab    = (t) => setSearchParams({ tab: t }, { replace: true });

    return (
      <>
        <IonHeader style={{ '--background': barColor }}>
          <IonToolbar style={toolbarStyle}>
            <IonButtons slot="start">
              <button
                onClick={() => navigate(-1)}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 4, transition: 'background-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <IonIcon name="chevron-back-outline" style={{ fontSize: 26, pointerEvents: 'none' }} />
              </button>
            </IonButtons>
            <span slot="start" style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.01em', color: '#fff', marginLeft: 4 }}>
              {displayTitle}
            </span>
            <IonButtons slot="end">
              {config.messageMode ? (
                <button
                  onClick={() => navigate(`/${user.role}/messages`)}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 4, transition: 'background-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <IonIcon name="chatbubble-outline" style={{ fontSize: 22, pointerEvents: 'none' }} />
                </button>
              ) : (
                <button
                  onClick={() => setNotifOpen(true)}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', marginRight: 4, transition: 'background-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <IonIcon name="notifications-outline" style={{ fontSize: 22, pointerEvents: 'none' }} />
                  {notifCount > 0 && (
                    <IonBadge color="danger" style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.6rem', minWidth: 16, height: 16, borderRadius: 8, pointerEvents: 'none', border: `2px solid ${barColor}` }}>
                      {notifCount > 9 ? '9+' : notifCount}
                    </IonBadge>
                  )}
                </button>
              )}
            </IonButtons>
          </IonToolbar>

          {/* Tab row */}
          {hasTabs && (
            <IonToolbar style={{ ...toolbarStyle, '--min-height': isMobile ? '48px' : '56px' }}>
              {isMobile ? (
                <>
                  <div
                    id="tab-menu-trigger"
                    onClick={() => setTabMenuOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', height: 48, cursor: 'pointer', color: '#fff' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {config.tabs.find(t => t.key === activeTab)?.label}
                    </span>
                    <IonIcon name="chevron-down-outline" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                  </div>
                  <IonPopover open={tabMenuOpen} onDidDismiss={() => setTabMenuOpen(false)} trigger="tab-menu-trigger" triggerAction="click">
                    <IonList lines="none">
                      {config.tabs.map(({ key, label }) => (
                        <IonItem key={key} button detail={false} onClick={() => { setTab(key); setTabMenuOpen(false); }} style={{ '--background': activeTab === key ? 'var(--ion-color-step-100)' : 'transparent' }}>
                          <IonLabel style={{ fontWeight: activeTab === key ? 700 : 500, fontSize: '0.875rem' }}>{label}</IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  </IonPopover>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'stretch', height: 56, width: '100%' }}>
                  {config.tabs.map(({ key, label }) => (
                    <ImmersiveTab key={key} label={label} active={activeTab === key} onClick={() => setTab(key)} />
                  ))}
                </div>
              )}
            </IonToolbar>
          )}
        </IonHeader>

        {/* Notifications drawer */}
        {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)' }} />}
        <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: NOTIF_DRAWER_WIDTH, zIndex: 1001, backgroundColor: 'var(--ion-card-background)', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)', transform: notifOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' }}>
          <NotificationsPanel onClose={() => setNotifOpen(false)} onCountChange={setNotifCount} />
        </div>
      </>
    );
  }

  // ── Normal mode ─────────────────────────────────────────────────────────────
  const nav = user.role === 'carrier' ? CARRIER_NAV
            : user.role === 'broker'  ? BROKER_NAV
            : user.role === 'driver'  ? DRIVER_NAV
            : ADMIN_NAV;

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const activeNavItem = nav.find(item => isActive(item.path));

  return (
    <>
      <IonHeader>
        <IonToolbar style={toolbarStyle}>
          {/* Menu toggle */}
          <IonButtons slot="start">
            {isMobile ? (
              <IonMenuButton style={{ '--color': 'rgba(255,255,255,0.85)' }} />
            ) : (
              <button
                onClick={onToggleSidebar}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 4, transition: 'background-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <IonIcon name="menu-outline" style={{ fontSize: '1.5rem', pointerEvents: 'none' }} />
              </button>
            )}
          </IonButtons>

          {/* Center: nav links (desktop) | mobile dropdown | search */}
          <div ref={searchPanelRef} style={{ flex: 1, minWidth: 0, position: 'relative', height: 60, display: 'flex', alignItems: 'center' }}>
            {/* Desktop nav */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'stretch', height: 60, width: '100%', overflowX: 'auto', scrollbarWidth: 'none', opacity: searchOpen ? 0 : 1, transition: 'opacity 0.18s', pointerEvents: searchOpen ? 'none' : 'auto' }}>
                {nav.map(item => (
                  <NavLink key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />
                ))}
              </div>
            )}

            {/* Mobile: current page label */}
            {isMobile && !searchOpen && (
              <div
                id="mobile-nav-trigger"
                onClick={() => setMobileNavOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px', height: '100%', cursor: 'pointer', color: '#fff' }}
              >
                {activeNavItem && <IonIcon name={activeNavItem.icon} style={{ fontSize: 18, flexShrink: 0 }} />}
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {activeNavItem?.label}
                </span>
                <IonIcon name="chevron-down-outline" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
              </div>
            )}

            {/* IonSearchbar */}
            <div style={{
              position: 'absolute', left: 0, right: 0, top: '50%',
              transform: searchOpen ? 'translateY(-50%) scaleX(1)' : 'translateY(-50%) scaleX(0.88)',
              transformOrigin: 'right center',
              opacity: searchOpen ? 1 : 0, transition: 'opacity 0.2s, transform 0.2s',
              pointerEvents: searchOpen ? 'auto' : 'none',
            }}>
              <IonSearchbar
                ref={searchRef}
                value={searchVal}
                onIonInput={e => setSearchVal(e.detail.value ?? '')}
                onKeyDown={e => e.key === 'Escape' && handleCloseSearch()}
                onIonCancel={handleCloseSearch}
                showCancelButton="always"
                placeholder="Search…"
                style={{
                  '--background': isDark ? 'var(--ion-background-color)' : '#ffffff',
                  '--color': isDark ? '#ffffff' : '#000000',
                  '--placeholder-color': isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                  '--icon-color': isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                  '--cancel-button-color': 'var(--ion-color-medium)',
                  '--border-radius': '0px',
                  '--box-shadow': '0 4px 24px rgba(0,0,0,0.18)',
                  padding: '0 4px',
                }}
              />
            </div>

            {/* Search results dropdown */}
            {searchOpen && (searchResults !== null || searchLoading) && (
              <div style={{ position: 'absolute', top: 62, left: 0, right: 0, zIndex: 9999, borderRadius: 8, overflow: 'hidden', minWidth: 320, backgroundColor: 'var(--ion-card-background)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <SearchPanel results={searchResults} loading={searchLoading} onNavigate={(item) => { navigate(item.conv_id ? `${item.path}?conv=${item.conv_id}` : item.path); handleCloseSearch(); }} />
              </div>
            )}
          </div>

          {/* Right icons */}
          <IonButtons slot="end">
            <button
              onClick={() => setSearchOpen(true)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.15s', opacity: searchOpen ? 0 : 1, pointerEvents: searchOpen ? 'none' : 'auto' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <IonIcon name="search-outline" style={{ fontSize: 22, pointerEvents: 'none' }} />
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', marginRight: 4, transition: 'background-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <IonIcon name="notifications-outline" style={{ fontSize: 22, pointerEvents: 'none' }} />
              {notifCount > 0 && (
                <IonBadge color="danger" style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.6rem', minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </IonBadge>
              )}
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Mobile nav dropdown */}
      <IonPopover open={mobileNavOpen} onDidDismiss={() => setMobileNavOpen(false)} trigger="mobile-nav-trigger" triggerAction="click" style={{ '--min-width': '200px', '--border-radius': '12px' }}>
        <IonList lines="none">
          {nav.map(item => {
            const active = isActive(item.path);
            return (
              <IonItem key={item.path} button detail={false} onClick={() => { navigate(item.path); setMobileNavOpen(false); }} style={{ '--background': active ? 'var(--ion-color-step-100)' : 'transparent', '--padding-start': '16px', '--padding-end': '16px' }}>
                <IonIcon name={item.icon} style={{ fontSize: 18, marginRight: 12, color: active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }} slot="start" />
                <IonLabel style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500 }}>{item.label}</IonLabel>
              </IonItem>
            );
          })}
        </IonList>
      </IonPopover>

      {/* Notifications drawer */}
      {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)' }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: NOTIF_DRAWER_WIDTH, zIndex: 1001, backgroundColor: 'var(--ion-card-background)', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)', transform: notifOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' }}>
        <NotificationsPanel onClose={() => setNotifOpen(false)} onCountChange={setNotifCount} />
      </div>
    </>
  );
}
