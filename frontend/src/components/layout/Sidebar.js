import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Badge, Tooltip, useMediaQuery, useTheme,
  Button, alpha, Popover,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  AddCircleOutline as AddIcon,
  Inventory2 as PackageIcon,
  Group as UsersIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Event as EventIcon,
  FlashOn as ZapIcon,
  ShowChart as ActivityIcon,
  Hub as NetworkIcon,
  ListAlt as ListChecksIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  ChatBubbleOutline as ChatIcon,
  Tune as PreferencesIcon,
  Build as ToolsIcon,
  Folder as FolderIcon,
  LocalShipping as TruckIcon,
  Badge as BadgeIcon,
  ChevronRight as ChevronRightIcon,
  ManageAccounts as ManageAccountsIcon,
  Business as BusinessIcon,
  SwitchAccount as SwitchAccountIcon,
  AddBusiness as AddBusinessIcon,
  Extension as IntegrationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { messagesApi, bookingsApi, networkApi, authApi } from '../../services/api';

export const DRAWER_WIDTH = 300;
export const DRAWER_COLLAPSED_WIDTH = 72; // kept for any external imports

const DRIVER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard', path: '/driver/dashboard' },
  { icon: TruckIcon,     label: 'My Loads',  path: '/driver/loads' },
  { icon: WalletIcon,    label: 'Earnings',  path: '/driver/earnings' },
  { icon: ChatIcon,      label: 'Messages',  path: '/driver/messages' },
];

const CARRIER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard',        path: '/carrier/dashboard' },
  { icon: ToolsIcon,     label: 'Tools',             path: '/carrier/tools' },
  { icon: TrendingUpIcon,label: 'Analytics',         path: '/carrier/analytics' },
  { icon: BadgeIcon,     label: 'My Drivers',        path: '/carrier/drivers' },
  { icon: NetworkIcon,   label: 'Network',           path: '/carrier/network', badge: 'network' },
  { icon: FolderIcon,    label: 'Documents',         path: '/carrier/documents' },
  { icon: CreditCardIcon,label: 'Billing',           path: '/carrier/billing' },
  { icon: IntegrationsIcon,label: 'Integrations',   path: '/integrations' },
  { icon: PreferencesIcon,label: 'Preferences',      path: '/preferences' },
];

const BROKER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard',         path: '/broker/dashboard' },
  { icon: AddIcon,       label: 'Post Load',         path: '/broker/post' },
  { icon: PackageIcon,   label: 'Manage Loads',      path: '/broker/loads' },
  { icon: ListChecksIcon,label: 'Templates',          path: '/broker/templates' },
  { icon: ActivityIcon,  label: 'In Progress',       path: '/broker/active' },
  { icon: BarChartIcon,  label: 'Analytics',         path: '/broker/analytics' },
  { icon: NetworkIcon,   label: 'Network',           path: '/broker/network' },
  { icon: FolderIcon,    label: 'Documents',         path: '/broker/documents' },
  { icon: EventIcon,     label: 'Booking Requests',  path: '/broker/bookings', badge: 'bookings' },
  { icon: ZapIcon,       label: 'Instant Book',      path: '/broker/instant-book' },
  { icon: PaymentIcon,   label: 'Payments',          path: '/broker/payments' },
  { icon: CreditCardIcon,label: 'Billing',           path: '/broker/billing' },
  { icon: IntegrationsIcon,label: 'Integrations',   path: '/integrations' },
  { icon: PreferencesIcon,label: 'Preferences',      path: '/preferences' },
];

const ADMIN_LINKS = [
  { icon: DashboardIcon,  label: 'Overview',          path: '/admin' },
  { icon: UsersIcon,      label: 'Users',             path: '/admin/users' },
  { icon: PackageIcon,    label: 'Load Moderation',   path: '/admin/loads' },
  { icon: MoneyIcon,      label: 'Revenue',           path: '/admin/revenue' },
  { icon: PaymentIcon,    label: 'Payments',          path: '/admin/payments' },
  { icon: ListChecksIcon, label: 'Waitlist',          path: '/admin/waitlist' },
  { icon: ChatIcon,       label: 'Contact Messages',  path: '/admin/contacts' },
];

function NavItem({ item, badgeCount, active, onClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const c = {
    text:        isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.60)',
    textActive:  isDark ? '#fff' : theme.palette.primary.main,
    hover:       isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    activeBg:    isDark ? 'rgba(255,255,255,0.12)' : alpha(theme.palette.primary.main, 0.08),
    activeHover: isDark ? 'rgba(255,255,255,0.16)' : alpha(theme.palette.primary.main, 0.13),
  };
  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={active}
        onClick={onClick}
        sx={{
          borderRadius: '0 !important',
          px: 2.5,
          py: 1.25,
          minHeight: 48,
          color: c.text,
          '&:hover': { bgcolor: c.hover, color: isDark ? '#fff' : 'text.primary' },
          '&.Mui-selected': {
            bgcolor: c.activeBg,
            color: c.textActive,
            '&:hover': { bgcolor: c.activeHover },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
          <Badge badgeContent={badgeCount > 0 ? (badgeCount > 9 ? '9+' : badgeCount) : null} color="error" max={9}>
            <item.icon fontSize="small" />
          </Badge>
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
        />
      </ListItemButton>
    </ListItem>
  );
}

function SidebarContent({ onNavigate, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';
  const sc = {
    divider:      isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    dividerFaint: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    icon:         isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
    iconHover:    isDark ? '#fff' : '#0D1B2A',
    nameColor:    isDark ? '#fff' : '#0D1B2A',
    subtitleColor:isDark ? 'rgba(255,255,255,0.45)' : '#78909C',
    planColor:    isDark ? 'primary.light' : 'primary.main',
    msgBorder:    isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
    msgText:      isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)',
    msgHoverBorder:isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
    msgHoverBg:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    msgIconActive:isDark ? 'primary.light' : 'primary.main',
    msgIconIdle:  isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
    logoutColor:  isDark ? '#ef9a9a' : '#C62828',
    logoutHoverBg:'rgba(239,83,80,0.12)',
    logoutHoverColor:'#ef5350',
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [pendingNetwork, setPendingNetwork] = useState(0);

  // Popover anchors
  const [bizAnchor,  setBizAnchor]  = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const bizOpen  = Boolean(bizAnchor);
  const userOpen = Boolean(userAnchor);

  // Clock in/out  — states: 'out' | 'in' | 'paused'
  const parseUtc = (ts) => ts ? new Date(ts.endsWith('Z') ? ts : ts + 'Z') : null;
  const PAUSE_KEY = 'hauliq_clock_pause'; // localStorage key

  // Derive initial state — check localStorage for a persisted pause
  const _savedPause = (() => { try { return JSON.parse(localStorage.getItem(PAUSE_KEY)); } catch { return null; } })();
  const _initialState = user?.clocked_in
    ? (_savedPause ? 'paused' : 'in')
    : 'out';
  const _initialAt = _savedPause
    ? new Date(Date.now() - _savedPause.elapsedMs) // virtual clockedInAt that preserves paused offset
    : parseUtc(user?.clocked_in_at);

  const [clockState,   setClockState]   = useState(_initialState);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockedInAt,  setClockedInAt]  = useState(_initialAt);
  const [elapsed, setElapsed] = useState('');
  const pausedMsRef = useRef(_savedPause?.elapsedMs ?? 0);

  // Sync clock state when user object first loads after refresh
  useEffect(() => {
    if (!user) return;
    const saved = (() => { try { return JSON.parse(localStorage.getItem(PAUSE_KEY)); } catch { return null; } })();
    if (!user.clocked_in) {
      // clocked out — clear everything
      localStorage.removeItem(PAUSE_KEY);
      pausedMsRef.current = 0;
      setClockState('out');
      setClockedInAt(null);
      return;
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
    if (clockState === 'out') { setElapsed(''); return; }
    if (clockState === 'paused') return; // freeze — don't clear, don't tick
    // clockState === 'in'
    const tick = () => {
      if (!clockedInAt) return;
      const secs = Math.floor((Date.now() - clockedInAt.getTime()) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setElapsed(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockState, clockedInAt]);

  const clockedIn = clockState !== 'out';

  const handleClockToggle = async (action) => {
    if (clockLoading) return;
    if (action === 'pause') {
      const elapsedMs = clockedInAt ? Date.now() - clockedInAt.getTime() : 0;
      pausedMsRef.current = elapsedMs;
      localStorage.setItem(PAUSE_KEY, JSON.stringify({ elapsedMs }));
      setClockState('paused');
      return;
    }
    if (action === 'continue') {
      localStorage.removeItem(PAUSE_KEY);
      setClockedInAt(new Date(Date.now() - pausedMsRef.current));
      setClockState('in');
      return;
    }
    setClockLoading(true);
    try {
      let updated;
      if (action === 'in') {
        const loc = await new Promise((resolve) => {
          if (!navigator.geolocation) { resolve({}); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            ()    => resolve({}),
            { timeout: 5000 },
          );
        });
        updated = await authApi.clockIn(loc);
      } else {
        updated = await authApi.clockOut();
      }
      const newState = updated.clocked_in ? 'in' : 'out';
      pausedMsRef.current = 0;
      localStorage.removeItem(PAUSE_KEY);
      setClockState(newState);
      setClockedInAt(newState === 'in' ? new Date() : null);
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
    if (badge === 'unread') return unread;
    if (badge === 'bookings') return pendingBookings;
    if (badge === 'network') return pendingNetwork;
    return 0;
  };

  const isActive = (path) =>
    location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));

  const handleNav = (path) => { onNavigate?.(); navigate(path); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header: [X close] [centered logo] [theme toggle] */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 60,
          px: 1,
          flexShrink: 0,
        }}
      >
        <Tooltip title="Close menu" placement="right">
          <IconButton size="small" onClick={onClose} sx={{ color: sc.icon, '&:hover': { color: sc.iconHover } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src="/urload-logo.png" alt="HaulIQ" style={{ height: 30, width: 'auto' }} />
        </Box>

        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} placement="left">
          <IconButton size="small" onClick={toggleTheme} sx={{ color: sc.icon, '&:hover': { color: sc.iconHover } }}>
            {mode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ═══ User identity block ═══ */}
      <Box sx={{ px: 1, pb: 1.5, pt: 1.5, flexShrink: 0 }}>
      <Box sx={{
        borderRadius: '10px',
        overflow: 'hidden',
        bgcolor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${sc.divider}`,
      }}>
        {/* Business row */}
        <Box
          onClick={e => setBizAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2.5, py: 1.5, cursor: 'pointer',
            borderBottom: `1px solid ${sc.divider}`,
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          }}
        >
          <Avatar sx={{
            width: 40, height: 40,
            bgcolor: isDark ? '#444' : '#d0d0d0',
            color: isDark ? '#fff' : '#333',
            fontSize: '1rem', flexShrink: 0,
          }}>
            {(user.company || user.name)?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.68rem', color: sc.subtitleColor, lineHeight: 1.2, mb: '1px' }}>
              Business
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: sc.nameColor, lineHeight: 1.3 }} noWrap>
              {user.company || user.name}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ fontSize: 18, color: sc.subtitleColor, flexShrink: 0 }} />
        </Box>

        {/* Employee/User row */}
        <Box
          onClick={e => setUserAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2.5, py: 1.5, cursor: 'pointer',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          }}
        >
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={user.avatar_url || undefined}
              sx={{
                width: 40, height: 40,
                bgcolor: isDark ? '#444' : '#d0d0d0',
                color: isDark ? '#fff' : '#333',
                fontSize: '1rem',
              }}
            >
              {!user.avatar_url && (user.avatar || user.name?.charAt(0)?.toUpperCase())}
            </Avatar>
            <Box sx={{
              position: 'absolute', bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: clockState === 'in' ? '#2dd36f' : clockState === 'paused' ? '#ffce00' : '#eb445a',
              border: `2px solid ${isDark ? '#111' : '#f5f5f5'}`,
            }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.68rem', color: sc.subtitleColor, lineHeight: 1.2, mb: '1px', textTransform: 'capitalize' }}>
              {user.role}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.9rem', color: sc.nameColor, lineHeight: 1.3, minWidth: 0 }} noWrap>
                {user.name}
              </Typography>
              {elapsed && (
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0, lineHeight: 1.3 }}>
                  {elapsed}
                </Typography>
              )}
            </Box>
          </Box>
          <ChevronRightIcon sx={{ fontSize: 18, color: sc.subtitleColor, flexShrink: 0 }} />
        </Box>

        {/* Clock strip */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Left button: CLOCK-IN → PAUSE → CONTINUE */}
          {clockState === 'out' && (
            <Box component="button" onClick={() => handleClockToggle('in')}
              sx={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 0.6, py: 0.55, cursor: 'pointer', bgcolor: '#2dd36f', color: '#fff',
                fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em',
                borderRight: `1px solid ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                '&:hover': { bgcolor: '#27bc61' }, transition: 'background-color 0.15s' }}>
              <Box component="span" sx={{ fontSize: '0.55rem', lineHeight: 1 }}>▶</Box>CLOCK-IN
            </Box>
          )}
          {clockState === 'in' && (
            <Box component="button" onClick={() => handleClockToggle('pause')}
              sx={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 0.6, py: 0.55, cursor: 'pointer', bgcolor: '#ffce00', color: '#000',
                fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em',
                borderRight: `1px solid ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                '&:hover': { bgcolor: '#e6b800' }, transition: 'background-color 0.15s' }}>
              <Box component="span" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>⏸</Box>PAUSE
            </Box>
          )}
          {clockState === 'paused' && (
            <Box component="button" onClick={() => handleClockToggle('continue')}
              sx={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 0.6, py: 0.55, cursor: 'pointer', bgcolor: '#2a7fff', color: '#fff',
                fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em',
                borderRight: `1px solid ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                '&:hover': { bgcolor: '#1a6fe6' }, transition: 'background-color 0.15s' }}>
              <Box component="span" sx={{ fontSize: '0.55rem', lineHeight: 1 }}>▶</Box>CONTINUE
            </Box>
          )}
          {/* Right button: CLOCK-OUT */}
          <Box component="button"
            onClick={() => clockedIn && !clockLoading && handleClockToggle('out')}
            sx={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 0.6, py: 0.55, cursor: clockedIn ? 'pointer' : 'default',
              bgcolor: clockedIn ? '#eb445a' : (isDark ? 'rgba(235,68,90,0.12)' : 'rgba(235,68,90,0.1)'),
              color: clockedIn ? '#fff' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'),
              fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em',
              '&:hover': clockedIn ? { bgcolor: '#d03a4e' } : {},
              transition: 'background-color 0.15s' }}>
            <Box component="span" sx={{ fontSize: '0.75rem', lineHeight: 1, fontWeight: 400 }}>□</Box>CLOCK-OUT
          </Box>
        </Box>
      </Box>
      </Box>

      {/* Business popover */}
      <Popover
        open={bizOpen}
        anchorEl={bizAnchor}
        onClose={() => setBizAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          mt: 0.5, minWidth: 240,
          bgcolor: isDark ? '#1e1e1e' : '#fff',
        }}}
      >
        {/* Header: business name */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: `1px solid ${sc.divider}` }}>
          <Typography sx={{ fontSize: '0.68rem', color: sc.subtitleColor, mb: '2px' }}>Business</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: sc.nameColor }} noWrap>
            {user.company || user.name}
          </Typography>
        </Box>
        {[
          { icon: BusinessIcon,      label: 'Manage Business', action: () => { navigate('/settings'); setBizAnchor(null); } },
          { icon: SwitchAccountIcon, label: 'Switch Business', action: () => setBizAnchor(null) },
          { icon: AddBusinessIcon,   label: 'Add a business',  action: () => setBizAnchor(null) },
        ].map(({ icon: Icon, label, action }, i, arr) => (
          <Box key={label}>
            <Box
              onClick={action}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 2.5, py: 1.4, cursor: 'pointer',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' } }}
            >
              <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.9rem', color: sc.nameColor }}>{label}</Typography>
            </Box>
            {i < arr.length - 1 && <Divider sx={{ borderColor: sc.dividerFaint }} />}
          </Box>
        ))}
        <Box sx={{ height: 4 }} />
      </Popover>

      {/* User popover */}
      <Popover
        open={userOpen}
        anchorEl={userAnchor}
        onClose={() => setUserAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          mt: 0.5, minWidth: 220,
          bgcolor: isDark ? '#1e1e1e' : '#fff',
        }}}
      >
        {/* Header: user name */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: `1px solid ${sc.divider}` }}>
          <Typography sx={{ fontSize: '0.68rem', color: sc.subtitleColor, mb: '2px', textTransform: 'capitalize' }}>{user.role}</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: sc.nameColor }} noWrap>{user.name}</Typography>
        </Box>
        <Box
          onClick={() => { navigate('/profile'); setUserAnchor(null); }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 2.5, py: 1.4, cursor: 'pointer',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' } }}
        >
          <ManageAccountsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: '0.9rem', color: sc.nameColor }}>Manage profile</Typography>
        </Box>
        <Divider sx={{ borderColor: sc.dividerFaint }} />
        <Box
          onClick={() => { setUserAnchor(null); logout(); navigate('/'); }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 2.5, py: 1.4, cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(239,83,80,0.08)' } }}
        >
          <LogoutIcon sx={{ fontSize: 20, color: 'error.main' }} />
          <Typography sx={{ fontSize: '0.9rem', color: 'error.main' }}>Log out</Typography>
        </Box>
        <Box sx={{ height: 4 }} />
      </Popover>

      {/* Message Center button */}
      {messagesPath && (
        <>
          <Box sx={{ px: 2, pb: 1.5, flexShrink: 0 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<ChatIcon fontSize="small" />}
              onClick={() => handleNav(messagesPath)}
              sx={{
                borderRadius: 1.5,
                borderColor: sc.msgBorder,
                color: sc.msgText,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                py: 0.75,
                '&:hover': { borderColor: sc.msgHoverBorder, bgcolor: sc.msgHoverBg },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Message Center
                {unread > 0 && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }} />
                )}
              </Box>
            </Button>
          </Box>
          <Divider sx={{ borderColor: sc.divider }} />
        </>
      )}

      {/* Nav list */}
      <List dense disablePadding sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {links.map((item, idx) => (
          <Box key={item.path}>
            {idx > 0 && <Divider sx={{ borderColor: sc.dividerFaint }} />}
            <NavItem
              item={item}
              badgeCount={item.badge ? getBadge(item.badge) : 0}
              active={isActive(item.path)}
              onClick={() => handleNav(item.path)}
            />
          </Box>
        ))}
      </List>

      {/* Bottom: theme toggle */}
      <Divider sx={{ borderColor: sc.divider }} />
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose, sidebarOpen, onClose, onMobileOpen }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : 0;

  const drawerSx = {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: DRAWER_WIDTH,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  };

  return (
    <>
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{ ...drawerSx, display: { xs: 'block', lg: 'none' } }}
        >
          <SidebarContent onNavigate={onMobileClose} onClose={onMobileClose} />
        </Drawer>
      )}

      {/* Desktop drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            ...drawerSx,
            display: { xs: 'none', lg: 'block' },
            width: drawerWidth,
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? DRAWER_WIDTH : 0,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          <SidebarContent onClose={onClose} />
        </Drawer>
      )}
    </>
  );
}
