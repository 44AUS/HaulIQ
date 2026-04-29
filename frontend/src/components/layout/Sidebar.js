import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IonList, IonItem, IonLabel, IonBadge, IonButton,
  IonAvatar, IonPopover, IonChip, IonText,
} from '@ionic/react';
import IonIcon from '../IonIcon';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { messagesApi, bookingsApi, networkApi, authApi } from '../../services/api';

export const DRAWER_WIDTH = 300;
export const DRAWER_COLLAPSED_WIDTH = 72;

const DRIVER_LINKS = [
  { icon: 'car-sport-outline',   label: 'My Loads',  path: '/driver/loads' },
  { icon: 'wallet-outline',      label: 'Earnings',  path: '/driver/earnings' },
  { icon: 'chatbubble-outline',  label: 'Messages',  path: '/driver/messages' },
];

const CARRIER_LINKS = [
  { icon: 'build-outline',            label: 'Tools',        path: '/carrier/tools' },
  { icon: 'trending-up-outline',      label: 'Analytics',    path: '/carrier/analytics' },
  { icon: 'id-card-outline',          label: 'My Drivers',   path: '/carrier/drivers' },
  { icon: 'git-network-outline',      label: 'Network',      path: '/carrier/network', badge: 'network' },
  { icon: 'folder-outline',           label: 'Documents',    path: '/carrier/documents' },
  { icon: 'card-outline',             label: 'Billing',      path: '/carrier/billing' },
  { icon: 'extension-puzzle-outline', label: 'Integrations', path: '/integrations' },
  { icon: 'options-outline',          label: 'Preferences',  path: '/preferences' },
];

const BROKER_LINKS = [
  { icon: 'add-circle-outline',       label: 'Post Load',        path: '/broker/post' },
  { icon: 'cube-outline',             label: 'Manage Loads',     path: '/broker/loads' },
  { icon: 'list-outline',             label: 'Templates',        path: '/broker/templates' },
  { icon: 'analytics-outline',        label: 'In Progress',      path: '/broker/active' },
  { icon: 'bar-chart-outline',        label: 'Analytics',        path: '/broker/analytics' },
  { icon: 'git-network-outline',      label: 'Network',          path: '/broker/network' },
  { icon: 'folder-outline',           label: 'Documents',        path: '/broker/documents' },
  { icon: 'calendar-outline',         label: 'Booking Requests', path: '/broker/bookings', badge: 'bookings' },
  { icon: 'flash-outline',            label: 'Instant Book',     path: '/broker/instant-book' },
  { icon: 'card-outline',             label: 'Payments',         path: '/broker/payments' },
  { icon: 'card-outline',             label: 'Billing',          path: '/broker/billing' },
  { icon: 'extension-puzzle-outline', label: 'Integrations',     path: '/integrations' },
  { icon: 'options-outline',          label: 'Preferences',      path: '/preferences' },
];

const ADMIN_LINKS = [
  { icon: 'grid-outline',        label: 'Overview',          path: '/admin' },
  { icon: 'people-outline',      label: 'Users',             path: '/admin/users' },
  { icon: 'cube-outline',        label: 'Load Moderation',   path: '/admin/loads' },
  { icon: 'cash-outline',        label: 'Revenue',           path: '/admin/revenue' },
  { icon: 'card-outline',        label: 'Payments',          path: '/admin/payments' },
  { icon: 'list-outline',        label: 'Waitlist',          path: '/admin/waitlist' },
  { icon: 'chatbubble-outline',  label: 'Contact Messages',  path: '/admin/contacts' },
];

export default function Sidebar({ onNavigate, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const [unread, setUnread] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [pendingNetwork, setPendingNetwork] = useState(0);
  const [bizPopoverOpen, setBizPopoverOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const bizRef  = useRef(null);
  const userRef = useRef(null);

  // ── Clock in/out ──
  const parseUtc   = (ts) => ts ? new Date(ts.endsWith('Z') ? ts : ts + 'Z') : null;
  const PAUSE_KEY  = 'hauliq_clock_pause';
  const _savedPause = (() => { try { return JSON.parse(localStorage.getItem(PAUSE_KEY)); } catch { return null; } })();
  const _initial    = user?.clocked_in ? (_savedPause ? 'paused' : 'in') : 'out';
  const _initialAt  = _savedPause
    ? new Date(Date.now() - _savedPause.elapsedMs)
    : parseUtc(user?.clocked_in_at);

  const [clockState,   setClockState]   = useState(_initial);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockedInAt,  setClockedInAt]  = useState(_initialAt);
  const [elapsed,      setElapsed]      = useState('');
  const pausedMsRef = useRef(_savedPause?.elapsedMs ?? 0);

  useEffect(() => {
    if (!user) return;
    const saved = (() => { try { return JSON.parse(localStorage.getItem(PAUSE_KEY)); } catch { return null; } })();
    if (!user.clocked_in) {
      localStorage.removeItem(PAUSE_KEY); pausedMsRef.current = 0;
      setClockState('out'); setClockedInAt(null); return;
    }
    if (saved) {
      pausedMsRef.current = saved.elapsedMs;
      setClockedInAt(new Date(Date.now() - saved.elapsedMs));
      setClockState('paused');
    } else {
      pausedMsRef.current = 0;
      setClockedInAt(parseUtc(user.clocked_in_at));
      setClockState('in');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.clocked_in, user?.clocked_in_at]);

  useEffect(() => {
    if (clockState === 'out')    { setElapsed(''); return; }
    if (clockState === 'paused') return;
    const tick = () => {
      if (!clockedInAt) return;
      const s = Math.floor((Date.now() - clockedInAt.getTime()) / 1000);
      setElapsed(`${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockState, clockedInAt]);

  const clockedIn = clockState !== 'out';

  const handleClockToggle = async (action) => {
    if (clockLoading) return;
    if (action === 'pause') {
      const ms = clockedInAt ? Date.now() - clockedInAt.getTime() : 0;
      pausedMsRef.current = ms;
      localStorage.setItem(PAUSE_KEY, JSON.stringify({ elapsedMs: ms }));
      setClockState('paused'); return;
    }
    if (action === 'continue') {
      localStorage.removeItem(PAUSE_KEY);
      setClockedInAt(new Date(Date.now() - pausedMsRef.current));
      setClockState('in'); return;
    }
    setClockLoading(true);
    try {
      let updated;
      if (action === 'in') {
        const loc = await new Promise((resolve) => {
          if (!navigator.geolocation) { resolve({}); return; }
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            ()  => resolve({}), { timeout: 5000 });
        });
        updated = await authApi.clockIn(loc);
      } else {
        updated = await authApi.clockOut();
      }
      const ns = updated.clocked_in ? 'in' : 'out';
      pausedMsRef.current = 0;
      localStorage.removeItem(PAUSE_KEY);
      setClockState(ns);
      setClockedInAt(ns === 'in' ? new Date() : null);
      updateUser({ clocked_in: updated.clocked_in, clocked_in_at: updated.clocked_in_at });
    } catch {}
    setClockLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    messagesApi.unreadCount().then(d => setUnread(d.unread || 0)).catch(() => {});
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user || user.role !== 'broker') return;
    bookingsApi.pending().then(d => setPendingBookings(Array.isArray(d) ? d.filter(b => b.status === 'pending').length : 0)).catch(() => {});
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user || user.role !== 'carrier') return;
    networkApi.requests().then(d => setPendingNetwork(Array.isArray(d) ? d.length : 0)).catch(() => {});
  }, [user, location.pathname]);

  if (!user) return null;

  const links = user.role === 'carrier' ? CARRIER_LINKS
              : user.role === 'broker'  ? BROKER_LINKS
              : user.role === 'driver'  ? DRIVER_LINKS
              : ADMIN_LINKS;

  const messagesPath = user.role === 'carrier' ? '/carrier/messages'
                     : user.role === 'broker'  ? '/broker/messages'
                     : user.role === 'driver'  ? '/driver/messages'
                     : null;

  const getBadge = (badge) => {
    if (badge === 'unread')   return unread;
    if (badge === 'bookings') return pendingBookings;
    if (badge === 'network')  return pendingNetwork;
    return 0;
  };

  const isActive = (path) =>
    location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));

  const handleNav = (path) => { onNavigate?.(); navigate(path); };

  const divColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const nameColor = isDark ? '#fff' : '#0D1B2A';
  const subColor  = isDark ? 'rgba(255,255,255,0.45)' : '#78909C';
  const iconColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', userSelect: 'none', backgroundColor: 'var(--app-sidebar-bg)' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 60, padding: '0 8px', flexShrink: 0 }}>
        <IonButton fill="clear" style={{ '--color': iconColor, '--border-radius': '50%' }} onClick={() => { onClose?.(); const m = document.querySelector('ion-menu'); if (m) m.close(); }}>
          <IonIcon slot="icon-only" name="close-outline" style={{ fontSize: 22 }} />
        </IonButton>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src="/urload-logo.png" alt="Urload" style={{ height: 30, width: 'auto' }} />
        </div>
        <IonButton fill="clear" title={isDark ? 'Light mode' : 'Dark mode'} style={{ '--color': iconColor, '--border-radius': '50%' }} onClick={toggleTheme}>
          <IonIcon slot="icon-only" name={isDark ? 'sunny-outline' : 'moon-outline'} style={{ fontSize: 20 }} />
        </IonButton>
      </div>

      {/* User identity block */}
      <div style={{ padding: '0 8px 12px', flexShrink: 0 }}>
        {user.subscription?.status === 'trialing' && (() => {
          const daysLeft = user.subscription.current_period_end
            ? Math.max(0, Math.ceil((new Date(user.subscription.current_period_end) - Date.now()) / 86400000))
            : null;
          const billingPath = `/${user.role}/billing`;
          return (
            <IonChip
              color="warning"
              onClick={() => handleNav(billingPath)}
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '0 0 0 0', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer' }}
            >
              <IonText>{daysLeft !== null ? `Trialing (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : 'Trialing'}</IonText>
              <IonText color="success" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                Subscribe <ion-icon name="arrow-forward-outline" style={{ verticalAlign: 'sub', fontSize: 16, margin: 0 }} />
              </IonText>
            </IonChip>
          );
        })()}
        <div style={{ borderRadius: user.subscription?.status === 'trialing' ? '0 0 10px 10px' : 10, overflow: 'hidden', backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)', border: `1px solid ${divColor}` }}>

          {/* Business row */}
          <div
            ref={bizRef}
            id="biz-trigger"
            onClick={() => setBizPopoverOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', borderBottom: `1px solid ${divColor}` }}
          >
            <IonAvatar style={{ width: 40, height: 40, flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: isDark ? '#444' : '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#fff' : '#333', fontSize: '1rem', fontWeight: 600 }}>
                {(user.company || user.name)?.charAt(0)?.toUpperCase()}
              </div>
            </IonAvatar>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: subColor, lineHeight: 1.2, marginBottom: 1 }}>Business</div>
              <div style={{ fontSize: '0.9rem', color: nameColor, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.company || user.name}
              </div>
            </div>
            <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: subColor, flexShrink: 0 }} />
          </div>

          {/* User row */}
          <div
            ref={userRef}
            id="user-trigger"
            onClick={() => setUserPopoverOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <IonAvatar style={{ width: 40, height: 40 }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: isDark ? '#444' : '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#fff' : '#333', fontSize: '1rem', fontWeight: 600 }}>
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                }
              </IonAvatar>
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: clockState === 'in' ? '#2dd36f' : clockState === 'paused' ? '#ffce00' : '#eb445a',
                border: `2px solid ${isDark ? '#111' : '#f5f5f5'}`,
              }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.68rem', color: subColor, lineHeight: 1.2, marginBottom: 1, textTransform: 'capitalize' }}>{user.role}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', color: nameColor, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                {elapsed && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{elapsed}</span>}
              </div>
            </div>
            <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: subColor, flexShrink: 0 }} />
          </div>

          {/* Clock strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {clockState === 'out' && (
              <button onClick={() => handleClockToggle('in')} style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '4px 0', cursor: 'pointer', backgroundColor: '#2dd36f', color: '#fff', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', borderRight: `1px solid ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}` }}>
                <span style={{ fontSize: '0.55rem' }}>▶</span>CLOCK-IN
              </button>
            )}
            {clockState === 'in' && (
              <button onClick={() => handleClockToggle('pause')} style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '4px 0', cursor: 'pointer', backgroundColor: '#ffce00', color: '#000', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', borderRight: `1px solid ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}` }}>
                <span style={{ fontSize: '0.7rem' }}>⏸</span>PAUSE
              </button>
            )}
            {clockState === 'paused' && (
              <button onClick={() => handleClockToggle('continue')} style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '4px 0', cursor: 'pointer', backgroundColor: '#2a7fff', color: '#fff', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', borderRight: `1px solid ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}` }}>
                <span style={{ fontSize: '0.55rem' }}>▶</span>CONTINUE
              </button>
            )}
            <button
              onClick={() => clockedIn && !clockLoading && handleClockToggle('out')}
              style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '4px 0', cursor: clockedIn ? 'pointer' : 'default', backgroundColor: clockedIn ? '#eb445a' : (isDark ? 'rgba(235,68,90,0.12)' : 'rgba(235,68,90,0.1)'), color: clockedIn ? '#fff' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'), fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em' }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>□</span>CLOCK-OUT
            </button>
          </div>
        </div>
      </div>

      {/* Business popover */}
      <IonPopover
        isOpen={bizPopoverOpen}
        onDidDismiss={() => setBizPopoverOpen(false)}
        trigger="biz-trigger"
        triggerAction="click"
        style={{ '--width': '240px', '--border-radius': '12px' }}
      >
        <IonList lines="none">
          {[
            { icon: 'business-outline',        label: 'Manage Business', action: () => { navigate('/business'); setBizPopoverOpen(false); } },
            { icon: 'swap-horizontal-outline', label: 'Switch Business', action: () => setBizPopoverOpen(false) },
            { icon: 'add-outline',             label: 'Add a business',  action: () => setBizPopoverOpen(false) },
          ].map(({ icon, label, action }) => (
            <IonItem key={label} button detail={false} onClick={action} style={{ '--padding-start': '20px', '--padding-end': '20px', '--inner-padding-end': '0' }}>
              <IonIcon name={icon} style={{ fontSize: 20, marginRight: 14, color: 'var(--ion-color-medium)' }} />
              <IonLabel style={{ fontSize: '0.9rem' }}>{label}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonPopover>

      {/* User popover */}
      <IonPopover
        isOpen={userPopoverOpen}
        onDidDismiss={() => setUserPopoverOpen(false)}
        trigger="user-trigger"
        triggerAction="click"
        style={{ '--width': '220px', '--border-radius': '12px' }}
      >
        <IonList lines="none">
          <IonItem button detail={false} onClick={() => { navigate('/profile'); setUserPopoverOpen(false); }} style={{ '--padding-start': '20px', '--padding-end': '20px', '--inner-padding-end': '0' }}>
            <IonIcon name="person-circle-outline" style={{ fontSize: 20, marginRight: 14, color: 'var(--ion-color-medium)' }} />
            <IonLabel style={{ fontSize: '0.9rem' }}>Manage profile</IonLabel>
          </IonItem>
          <IonItem button detail={false} onClick={() => { setUserPopoverOpen(false); logout(); navigate('/'); }} style={{ '--padding-start': '20px', '--padding-end': '20px', '--inner-padding-end': '0' }}>
            <IonIcon name="log-out-outline" style={{ fontSize: 20, marginRight: 14, color: 'var(--ion-color-danger)' }} />
            <IonLabel style={{ fontSize: '0.9rem', color: 'var(--ion-color-danger)' }}>Log out</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>

      {/* Message Center */}
      {messagesPath && (
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <IonButton expand="block" fill="outline" style={{ '--border-radius': '8px', '--color': isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)', '--border-color': isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)', fontWeight: 600, fontSize: '0.8rem' }} onClick={() => handleNav(messagesPath)}>
            <IonIcon slot="start" name="chatbubble-outline" style={{ marginRight: 6 }} />
            Message Center
            {unread > 0 && <span slot="end" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--ion-color-danger)', flexShrink: 0, display: 'inline-block' }} />}
          </IonButton>
        </div>
      )}

      <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${divColor}` }} />

      {/* Nav list */}
      <IonList lines="inset" style={{ flexGrow: 1, overflowY: 'auto', padding: 0 }}>
        {links.map((item) => {
          const active    = isActive(item.path);
          const badgeCount = item.badge ? getBadge(item.badge) : 0;
          return (
            <IonItem
              key={item.path}
              button
              detail={false}
              onClick={() => handleNav(item.path)}
              style={{
                '--background':              active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(21,101,192,0.08)') : 'transparent',
                '--background-hover':        isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                '--background-hover-opacity':'1',
                '--color':                   isDark ? '#fff' : '#000',
                '--border-color':            divColor,
                '--min-height':              '48px',
                '--padding-start':           '20px',
                '--padding-end':             '0',
                '--inner-padding-end':       '0',
                fontWeight: active ? 600 : 400,
              }}
            >
              <div slot="start" style={{ position: 'relative', display: 'flex' }}>
                <IonIcon slot="start" color="medium" name={item.icon} style={{ fontSize: '1.25rem' }} />
                {badgeCount > 0 && (
                  <IonBadge color="danger" style={{ position: 'absolute', top: -6, right: -8, fontSize: '0.6rem', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '2px solid var(--app-sidebar-bg)' }}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </IonBadge>
                )}
              </div>
              <IonLabel>{item.label}</IonLabel>
            </IonItem>
          );
        })}
      </IonList>

      <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${divColor}` }} />

      {/* Settings link */}
      <IonList lines="none" style={{ padding: 0, flexShrink: 0 }}>
        {(() => {
          const active = location.pathname === '/settings';
          return (
            <IonItem
              button
              detail={false}
              onClick={() => handleNav('/settings')}
              style={{
                '--background':              active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(21,101,192,0.08)') : 'transparent',
                '--background-hover':        isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                '--background-hover-opacity':'1',
                '--color':                   isDark ? '#fff' : '#000',
                '--border-color':            divColor,
                '--min-height':              '48px',
                '--padding-start':           '20px',
                '--padding-end':             '0',
                '--inner-padding-end':       '0',
                fontWeight: active ? 600 : 400,
              }}
            >
              <IonIcon slot="start" color="medium" name="settings-outline" style={{ fontSize: '1.25rem' }} />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          );
        })()}
      </IonList>
    </div>
  );
}
