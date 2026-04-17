import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Typography, InputBase, Drawer,
  Divider, Badge, Tooltip, List,
  useTheme, useMediaQuery, Menu, MenuItem, Skeleton, Paper, Switch, Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Notifications as BellIcon,
  ChevronLeft as ChevronLeftIcon,
  ShowChart as ActivityIcon,
  AddCircleOutline as AddIcon,
  Inventory2 as PackageIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Group as UsersIcon,
  ListAlt as ListChecksIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  CheckCircleOutline as CheckIcon,
  PendingActions as PendingIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Layers as LayersIcon,
  LocalShipping as TruckIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Message as MsgIcon,
  Bookmark as SavedIcon,
  CheckCircle as DoneIcon,
  LocalAtm as PayIcon,
  EventNote as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { searchApi, notificationsApi } from '../../services/api';

const DEFAULT_BAR_COLOR = '#1565C0';
const BAR_COLOR_HOVER = 'rgba(255,255,255,0.12)';
const NOTIF_DRAWER_WIDTH = 360;

// ── Role nav configs ──────────────────────────────────────────────────────────
const CARRIER_NAV = [
  { icon: CalendarIcon,  label: 'Calendar',    path: '/carrier/calendar' },
  { icon: SearchIcon,    label: 'Load Board',  path: '/carrier/loads' },
  { icon: ActivityIcon,  label: 'Loads',       path: '/carrier/job-manager' },
  { icon: WalletIcon,    label: 'Payments',    path: '/carrier/payments' },
  { icon: TruckIcon,     label: 'My Trucks',   path: '/carrier/equipment' },
  { icon: SavedIcon,     label: 'Lane Watch',  path: '/carrier/lane-watches' },
];

const BROKER_NAV = [
  { icon: CalendarIcon,  label: 'Calendar',    path: '/broker/calendar' },
  { icon: AddIcon,       label: 'Post Load',   path: '/broker/post' },
  { icon: PackageIcon,   label: 'Loads',       path: '/broker/loads' },
  { icon: EventIcon,     label: 'Bookings',    path: '/broker/bookings' },
  { icon: PaymentIcon,   label: 'Payments',    path: '/broker/payments' },
  { icon: TruckIcon,     label: 'Trucks',      path: '/broker/trucks' },
];

const DRIVER_NAV = [
  { icon: TruckIcon,  label: 'My Loads', path: '/driver/loads' },
  { icon: WalletIcon, label: 'Earnings', path: '/driver/earnings' },
  { icon: MsgIcon,    label: 'Messages', path: '/driver/messages' },
];

const ADMIN_NAV = [
  { icon: DashboardIcon,  label: 'Overview',  path: '/admin' },
  { icon: UsersIcon,      label: 'Users',     path: '/admin/users' },
  { icon: PackageIcon,    label: 'Loads',     path: '/admin/loads' },
  { icon: MoneyIcon,      label: 'Revenue',   path: '/admin/revenue' },
  { icon: PaymentIcon,    label: 'Payments',  path: '/admin/payments' },
  { icon: ListChecksIcon, label: 'Waitlist',  path: '/admin/waitlist' },
  { icon: LayersIcon,     label: 'Plans',     path: '/admin/plans' },
  { icon: TruckIcon,      label: 'Equipment', path: '/admin/equipment' },
  { icon: CategoryIcon,   label: 'Classes',   path: '/admin/equipment-classes' },
];

// ── Single top nav link ───────────────────────────────────────────────────────
function NavLink({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.9,
        px: 2.5,
        height: '100%',
        cursor: 'pointer',
        position: 'relative',
        userSelect: 'none',
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        bgcolor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        '&:hover': { bgcolor: BAR_COLOR_HOVER, color: '#fff' },
        transition: 'all 0.15s',
        minWidth: 0,
        flexShrink: 0,
        '&::after': active ? {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: '3px 3px 0 0',
          bgcolor: '#fff',
        } : {},
      }}
    >
      <Icon sx={{ fontSize: 18, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {item.label}
      </Typography>
    </Box>
  );
}

// ── Icon by notification type ─────────────────────────────────────────────────
function NotifIcon({ type }) {
  const map = {
    new_bid:             <CheckIcon fontSize="small" color="warning" />,
    bid_accepted:        <CheckIcon fontSize="small" color="success" />,
    bid_rejected:        <CloseIcon fontSize="small" color="error" />,
    bid_countered:       <CheckIcon fontSize="small" color="info" />,
    booking_approved:    <CheckIcon fontSize="small" color="success" />,
    booking_denied:      <CloseIcon fontSize="small" color="error" />,
    new_booking_request: <PendingIcon fontSize="small" color="warning" />,
    lane_watch_match:    <BellIcon fontSize="small" color="primary" />,
    tms_update:          <ActivityIcon fontSize="small" color="info" />,
  };
  return map[type] || <BellIcon fontSize="small" color="action" />;
}

function notifPath(notif, role) {
  const d = notif.data || {};
  if (notif.type === 'new_bid' || notif.type === 'new_booking_request') {
    return d.load_id ? `/${role}/loads/${d.load_id}` : `/${role}/loads`;
  }
  if (notif.type === 'bid_accepted' || notif.type === 'booking_approved') {
    return `/${role}/active`;
  }
  if (notif.type === 'lane_watch_match') {
    return d.load_id ? `/carrier/loads/${d.load_id}` : '/carrier/loads';
  }
  return `/${role}/dashboard`;
}

// ── Notification preference categories ────────────────────────────────────────
const NOTIF_PREF_CATEGORIES = [
  {
    key: 'loads',
    label: 'Loads',
    desc: 'Notified when a bid is placed or accepted on a load',
    items: [
      { key: 'new_bid',      label: 'New Bids' },
      { key: 'bid_accepted', label: 'Bid Accepted' },
    ],
  },
  {
    key: 'bookings',
    label: 'Bookings',
    desc: 'Notified when a booking is requested, approved, or denied',
    items: [
      { key: 'new_booking_request', label: 'Booking Requests' },
      { key: 'booking_approved',    label: 'Booking Approved' },
      { key: 'booking_denied',      label: 'Booking Denied' },
    ],
  },
  {
    key: 'lane_watch',
    label: 'Lane Watch',
    desc: 'Notified when a lane watch match is found',
    items: [{ key: 'lane_watch_match', label: 'Lane Watch Matches' }],
  },
  {
    key: 'system',
    label: 'System',
    desc: 'TMS updates and platform notifications',
    items: [{ key: 'tms_update', label: 'TMS Updates' }],
  },
];

const PREF_STORAGE_KEY = 'hauliq_notif_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function savePrefs(prefs) {
  localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs));
}

// ── Swipeable notification row ─────────────────────────────────────────────────
function SwipeableNotifRow({ notif, onDelete, onClick, formatTime }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const ref     = useRef(null);
  const startX  = useRef(null);
  const dragX   = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const onPointerDown = (e) => {
    startX.current = e.clientX;
    dragX.current  = 0;
  };
  const onPointerMove = (e) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (delta > 0) return; // only left swipe
    dragX.current = delta;
    setOffset(Math.max(delta, -80));
  };
  const onPointerUp = () => {
    if (dragX.current < -50) {
      setOffset(-80);
      setSwiped(true);
    } else {
      setOffset(0);
      setSwiped(false);
    }
    startX.current = null;
  };

  return (
    <Box ref={ref} sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Red delete background — only visible when swiped */}
      {offset < 0 && (
        <Box sx={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          bgcolor: '#eb445a', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconButton size="small" onClick={() => onDelete(notif.id)} sx={{ color: '#fff' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Notification content */}
      <Box
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => { if (!swiped) onClick(notif); }}
        sx={{
          transform: `translateX(${offset}px)`,
          transition: startX.current !== null ? 'none' : 'transform 0.2s ease',
          cursor: 'pointer',
          px: 2.5, py: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
          bgcolor: notif.read ? 'background.paper' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          userSelect: 'none',
        }}
      >
        <Box sx={{ mt: 0.25, flexShrink: 0 }}>
          <NotifIcon type={notif.type} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="body2" fontWeight={notif.read ? 500 : 700} sx={{ flex: 1, mr: 1 }}>
              {notif.title}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, mt: 0.1 }}>
              {formatTime(notif.created_at)}
            </Typography>
          </Box>
          {notif.body && (
            <Typography variant="caption" color="text.secondary">{notif.body}</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── Preferences sub-panel ──────────────────────────────────────────────────────
function PreferencesPanel({ onBack, onClose }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  const isEnabled = (key) => prefs[key] !== false;

  const toggle = (key) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !isEnabled(key) };
      savePrefs(next);
      return next;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 1.5, py: 1.5, flexShrink: 0,
        boxShadow: '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)',
        zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={onBack} sx={{ mr: 0.5 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Typography variant="caption" color="text.disabled" sx={{ px: 2.5, pt: 2, pb: 0.5, display: 'block', fontWeight: 600, letterSpacing: '0.06em' }}>
          Preferences
        </Typography>
        {NOTIF_PREF_CATEGORIES.map((cat, ci) => (
          <Box key={cat.key}>
            {ci > 0 && <Divider />}
            {cat.items.length === 1 ? (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: 2.5, py: 1.5, gap: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{cat.label}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>{cat.desc}</Typography>
                </Box>
                <Switch
                  size="small"
                  checked={isEnabled(cat.items[0].key)}
                  onChange={() => toggle(cat.items[0].key)}
                  sx={{ flexShrink: 0 }}
                />
              </Box>
            ) : (
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>{cat.label}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{cat.desc}</Typography>
                {cat.items.map(item => (
                  <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Switch
                      size="small"
                      checked={isEnabled(item.key)}
                      onChange={() => toggle(item.key)}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Notifications panel content ───────────────────────────────────────────────
function NotificationsPanel({ onClose, onCountChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);

  const load = () => {
    if (!user) return;
    notificationsApi.list()
      .then(data => {
        setNotifs(Array.isArray(data) ? data : []);
        const unread = Array.isArray(data) ? data.filter(n => !n.read).length : 0;
        if (onCountChange) onCountChange(unread);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync prefs from localStorage whenever panel opens
  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const visibleNotifs = notifs.filter(n => {
    const stored = prefs[n.type];
    return stored !== false;
  });

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead()
      .then(() => {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        if (onCountChange) onCountChange(0);
      })
      .catch(() => {});
  };

  const handleDeleteAll = () => {
    notificationsApi.deleteAll()
      .then(() => {
        setNotifs([]);
        if (onCountChange) onCountChange(0);
      })
      .catch(() => {});
  };

  const handleDelete = (id) => {
    notificationsApi.delete(id).catch(() => {});
    setNotifs(prev => {
      const next = prev.filter(n => n.id !== id);
      if (onCountChange) onCountChange(next.filter(n => !n.read).length);
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


  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (showPrefs) {
    return (
      <PreferencesPanel
        onBack={() => { setShowPrefs(false); setPrefs(loadPrefs()); }}
        onClose={onClose}
      />
    );
  }

  return (
    <Box sx={{ width: NOTIF_DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 1.5, py: 1.5, flexShrink: 0,
        boxShadow: '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)',
        zIndex: 1,
      }}>
        <Box sx={{ pl: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Notification preferences">
            <IconButton size="small" onClick={() => setShowPrefs(true)} sx={{ color: 'text.secondary' }}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Items */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="75%" height={18} />
                  <Skeleton variant="text" width="50%" height={14} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : visibleNotifs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="body1" fontWeight={600}>All caught up!</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>No notifications right now.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {visibleNotifs.map((notif, i) => (
              <Box key={notif.id}>
                {i > 0 && <Divider />}
                <SwipeableNotifRow
                  notif={notif}
                  onDelete={handleDelete}
                  onClick={handleClick}
                  formatTime={formatTime}
                />
              </Box>
            ))}
          </List>
        )}
      </Box>

      {/* Bottom action buttons */}
      {!loading && notifs.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
            onClick={handleMarkAllRead}
            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#fff', color: '#000', '&:hover': { bgcolor: '#f0f0f0' }, py: 1, boxShadow: 'none' }}
          >
            Mark as Read
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={handleDeleteAll}
            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#eb445a', '&:hover': { bgcolor: '#c9374b' }, py: 1, boxShadow: 'none' }}
          >
            Delete All
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ── Search results panel ──────────────────────────────────────────────────────
const SEARCH_CATEGORIES = [
  { key: 'connections',       label: 'Connections',       Icon: PersonIcon },
  { key: 'messages',          label: 'Messages',           Icon: MsgIcon },
  { key: 'loads_in_progress', label: 'Loads In Progress', Icon: TruckIcon },
  { key: 'completed_loads',   label: 'Completed Loads',   Icon: DoneIcon },
  { key: 'saved_loads',       label: 'Saved Loads',       Icon: SavedIcon },
  { key: 'payments',          label: 'Payments',           Icon: PayIcon },
];

function SearchResultsPanel({ results, loading, onNavigate }) {
  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[1, 2, 3].map(i => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={13} sx={{ mt: 0.25 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  const hasAny = SEARCH_CATEGORIES.some(c => (results?.[c.key] || []).length > 0);
  if (!hasAny) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">No results found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 480, overflowY: 'auto', py: 1 }}>
      {SEARCH_CATEGORIES.map(({ key, label, Icon }) => {
        const items = results?.[key] || [];
        if (!items.length) return null;
        return (
          <Box key={key}>
            <Typography variant="caption" sx={{ px: 2, py: 0.75, display: 'block', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled', fontSize: '0.68rem' }}>
              {label}
            </Typography>
            {items.map(item => (
              <Box
                key={item.id}
                onClick={() => onNavigate(item)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1, cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.12s',
                }}
              >
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.85 }}>
                  <Icon sx={{ fontSize: 14, color: '#fff' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {key === 'connections' ? item.name
                      : key === 'messages' ? `${item.other_name}: ${item.body}`
                      : key === 'payments' ? `${item.origin} → ${item.destination}`
                      : `${item.origin} → ${item.destination}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {key === 'connections' ? (item.company || item.role)
                      : key === 'messages' ? 'Message'
                      : key === 'payments' ? `$${item.amount?.toFixed(2)} · ${item.status}`
                      : `${item.commodity || ''} · $${item.rate?.toLocaleString()}`}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 0.5 }} />
          </Box>
        );
      })}
    </Box>
  );
}

// ── Network tab item ──────────────────────────────────────────────────────────
function NetworkTab({ label, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        cursor: 'pointer',
        position: 'relative',
        color: active ? '#fff' : 'rgba(255,255,255,0.60)',
        userSelect: 'none',
        letterSpacing: '0.08em',
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        '&:hover': { color: '#fff' },
        transition: 'color 0.15s',
        '&::after': active ? {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: '3px 3px 0 0',
          bgcolor: '#fff',
        } : {},
      }}
    >
      {label}
    </Box>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar({ sidebarOpen, onToggleSidebar, immersiveMode }) {
  const { user } = useAuth();
  const { brandColor } = useThemeMode();
  const barColor = brandColor || DEFAULT_BAR_COLOR;
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const searchRef = useRef(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchPanelRef = useRef(null);

  // Fetch notification count — poll every 30s
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      notificationsApi.count()
        .then(d => setNotifCount(d.unread || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchVal || searchVal.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      searchApi.search(searchVal.trim())
        .then(data => setSearchResults(data))
        .catch(() => setSearchResults(null))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchVal]);

  useEffect(() => {
    const handler = (e) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchVal('');
    setSearchResults(null);
  };

  if (!user) return null;

  // ── Immersive-mode bar (network or billing) ────────────────────────────────
  if (immersiveMode) {
    const IMMERSIVE_CONFIG = {
      network: {
        title: 'Network',
        tabs: [
          { key: 'connections', label: 'Connections' },
          { key: 'know',        label: 'People You May Know' },
        ],
      },
      billing: {
        title: 'Billing',
        tabs: [
          { key: 'plans',     label: 'Subscription Plans' },
          { key: 'referrals', label: 'Referrals' },
        ],
      },
      messages: {
        title: 'Message Center',
        tabs: [],
      },
      analytics: {
        title: 'Analytics',
        tabs: [
          { key: 'loads',    label: 'Loads' },
          { key: 'payments', label: 'Payments' },
          { key: 'drivers',  label: 'Drivers' },
          { key: 'imports',  label: 'Imports' },
        ],
      },
      tools: {
        title: 'Tools',
        tabs: [
          { key: 'brain',      label: 'Earnings Brain' },
          { key: 'calculator', label: 'Profit Calculator' },
        ],
      },
      drivers: {
        title: 'My Drivers',
        tabs: [],
      },
      preferences: {
        title: 'Preferences',
        tabs: [
          { key: 'all',           label: 'All' },
          { key: 'branding',      label: 'Branding' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'equipment',     label: 'Equipment' },
          { key: 'documents',     label: 'Documents' },
          { key: 'billing',       label: 'Billing' },
          { key: 'privacy',       label: 'Privacy' },
          { key: 'security',      label: 'Security' },
          { key: 'support',       label: 'Support' },
        ],
      },
      profile: {
        title: 'Manage Profile',
        tabs: [
          { key: 'overview',   label: 'Overview' },
          { key: 'earnings',   label: 'Earnings' },
          { key: 'documents',  label: 'Documents' },
          { key: 'businesses', label: 'Businesses' },
          { key: 'time_off',   label: 'Time Off' },
          { key: 'metadata',   label: 'Metadata' },
        ],
      },
      load_detail: {
        title: 'Load Details',
        tabs: [
          { key: 'overview',   label: 'Overview' },
          { key: 'payments',   label: 'Payments' },
          { key: 'documents',  label: 'Documents' },
        ],
        messageMode: true,
      },
    };
    const config = IMMERSIVE_CONFIG[immersiveMode];
    const displayTitle = immersiveMode === 'profile' && user?.name ? user.name : config.title;
    const hasTabs = config.tabs.length > 0;
    const defaultTab = hasTabs ? config.tabs[0].key : null;
    const activeTab = searchParams.get('tab') || defaultTab;
    const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

    return (
      <>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: barColor,
            color: '#fff',
            flexShrink: 0,
            zIndex: theme.zIndex.appBar,
            borderRadius: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        >
          {/* Row 1 — Back + Title + Bell */}
          <Box sx={{ display: 'flex', alignItems: 'center', height: 56, px: 0 }}>
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{ ml: 1, color: '#fff', '&:hover': { bgcolor: BAR_COLOR_HOVER } }}
            >
              <ChevronLeftIcon sx={{ fontSize: 26 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.01em', whiteSpace: 'nowrap', ml: 1, color: '#fff' }}>
              {displayTitle}
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
              {config.messageMode ? (
                <Tooltip title="Messages" placement="bottom">
                  <IconButton
                    onClick={() => navigate(`/${user.role}/messages`)}
                    size="small"
                    sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}
                  >
                    <MsgIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Notifications" placement="bottom">
                  <IconButton
                    onClick={() => setNotifOpen(true)}
                    size="small"
                    sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}
                  >
                    <Badge badgeContent={notifCount > 0 ? (notifCount > 9 ? '9+' : notifCount) : null} color="error" max={9}>
                      <BellIcon sx={{ fontSize: 22 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Row 2 — Tabs (only when config has tabs) */}
          {hasTabs && (
            <Box sx={{ display: 'flex', alignItems: 'stretch', height: 56, width: '100%' }}>
              {config.tabs.map(({ key, label }) => (
                <NetworkTab
                  key={key}
                  label={label}
                  active={activeTab === key}
                  onClick={() => setTab(key)}
                />
              ))}
            </Box>
          )}
        </AppBar>

        <Drawer
          anchor="right"
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          PaperProps={{ sx: { width: NOTIF_DRAWER_WIDTH, borderRadius: 0 } }}
        >
          <NotificationsPanel onClose={() => setNotifOpen(false)} onCountChange={setNotifCount} />
        </Drawer>
      </>
    );
  }

  const nav = user.role === 'carrier' ? CARRIER_NAV
            : user.role === 'broker'  ? BROKER_NAV
            : user.role === 'driver'  ? DRIVER_NAV
            : ADMIN_NAV;

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: barColor,
          color: '#fff',
          height: 60,
          flexShrink: 0,
          zIndex: theme.zIndex.appBar,
          borderRadius: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        <Toolbar disableGutters sx={{ height: 60, minHeight: '60px !important', px: 0 }}>

          {/* Menu toggle — far left */}
          <Tooltip title={sidebarOpen ? 'Close menu' : 'Open menu'} placement="bottom">
            <IconButton
              onClick={onToggleSidebar}
              size="small"
              sx={{ ml: 1.5, mr: 0.5, color: 'rgba(255,255,255,0.85)', flexShrink: 0, '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          {/* Center area: nav links (desktop) | mobile dropdown trigger | expanding search */}
          <Box ref={searchPanelRef} sx={{ flex: 1, minWidth: 0, position: 'relative', height: 60, display: 'flex', alignItems: 'center' }}>

            {/* Desktop nav links — fades out when search opens */}
            {!isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  height: 60,
                  width: '100%',
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                  opacity: searchOpen ? 0 : 1,
                  transition: 'opacity 0.18s',
                  pointerEvents: searchOpen ? 'none' : 'auto',
                }}
              >
                {nav.map(item => (
                  <NavLink
                    key={item.path}
                    item={item}
                    active={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                  />
                ))}
              </Box>
            )}

            {/* Mobile: MoreVert dropdown button */}
            {isMobile && !searchOpen && (
              <Tooltip title="Navigation" placement="bottom">
                <IconButton
                  onClick={e => setMobileMenuAnchor(e.currentTarget)}
                  size="small"
                  sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Expanding search bar — overlays center area when open */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                transform: searchOpen
                  ? 'translateY(-50%) scaleX(1)'
                  : 'translateY(-50%) scaleX(0.88)',
                transformOrigin: 'right center',
                opacity: searchOpen ? 1 : 0,
                transition: 'opacity 0.2s, transform 0.2s',
                pointerEvents: searchOpen ? 'auto' : 'none',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.16)',
                borderRadius: 1.5,
                px: 1.5,
                height: 38,
                mx: 0.5,
                backdropFilter: 'blur(4px)',
              }}
            >
              <SearchIcon sx={{ fontSize: 17, mr: 1, opacity: 0.8, flexShrink: 0 }} />
              <InputBase
                inputRef={searchRef}
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && handleCloseSearch()}
                placeholder="Search…"
                sx={{
                  flex: 1,
                  color: '#fff',
                  fontSize: '0.85rem',
                  '& input::placeholder': { color: 'rgba(255,255,255,0.65)', opacity: 1 },
                }}
              />
              <IconButton
                size="small"
                onClick={handleCloseSearch}
                sx={{ color: 'rgba(255,255,255,0.75)', p: 0.25, '&:hover': { color: '#fff' } }}
              >
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>

            {/* Search results panel */}
            {searchOpen && (searchResults !== null || searchLoading) && (
              <Paper
                elevation={8}
                sx={{
                  position: 'absolute',
                  top: 62,
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  borderRadius: 2,
                  overflow: 'hidden',
                  minWidth: 320,
                }}
              >
                <SearchResultsPanel
                  results={searchResults}
                  loading={searchLoading}
                  onNavigate={(item) => {
                    if (item.conv_id) {
                      navigate(`${item.path}?conv=${item.conv_id}`);
                    } else {
                      navigate(item.path);
                    }
                    handleCloseSearch();
                  }}
                />
              </Paper>
            )}
          </Box>

          {/* Right: search icon + notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, gap: 0.5, flexShrink: 0 }}>
            {/* Search icon — hidden when search is open */}
            <Tooltip title="Search" placement="bottom">
              <IconButton
                onClick={() => setSearchOpen(true)}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER },
                  opacity: searchOpen ? 0 : 1,
                  transition: 'opacity 0.18s',
                  pointerEvents: searchOpen ? 'none' : 'auto',
                }}
              >
                <SearchIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Notifications bell */}
            <Tooltip title="Notifications" placement="bottom">
              <IconButton
                onClick={() => setNotifOpen(true)}
                size="small"
                sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}
              >
                <Badge badgeContent={notifCount > 0 ? (notifCount > 9 ? '9+' : notifCount) : null} color="error" max={9}>
                  <BellIcon sx={{ fontSize: 22 }} />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile nav dropdown */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={() => setMobileMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {nav.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <MenuItem
              key={item.path}
              onClick={() => { navigate(item.path); setMobileMenuAnchor(null); }}
              selected={active}
              sx={{
                gap: 1.5,
                py: 1.25,
                fontWeight: active ? 700 : 500,
                fontSize: '0.875rem',
              }}
            >
              <Icon sx={{ fontSize: 18, color: active ? 'primary.main' : 'text.secondary' }} />
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Notifications slide-in drawer */}
      <Drawer
        anchor="right"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        PaperProps={{ sx: { width: NOTIF_DRAWER_WIDTH, borderRadius: 0 } }}
      >
        <NotificationsPanel onClose={() => setNotifOpen(false)} onCountChange={setNotifCount} />
      </Drawer>
    </>
  );
}
