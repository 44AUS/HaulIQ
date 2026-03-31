import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Typography, InputBase, Drawer,
  Divider, Badge, Tooltip, List, ListItem, ListItemIcon, ListItemText,
  Chip, useMediaQuery, useTheme, alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Notifications as BellIcon,
  ShowChart as ActivityIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  AddCircleOutline as AddIcon,
  Inventory2 as PackageIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Group as UsersIcon,
  ListAlt as ListChecksIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  ChatBubbleOutline as ChatIcon,
  HowToReg as HowToRegIcon,
  CheckCircleOutline as CheckIcon,
  PendingActions as PendingIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { messagesApi, bookingsApi, networkApi, bidsApi } from '../../services/api';

const BAR_COLOR = '#00796B';
const BAR_COLOR_HOVER = 'rgba(255,255,255,0.12)';
const NOTIF_DRAWER_WIDTH = 360;

// ── Role nav configs ──────────────────────────────────────────────────────────
const CARRIER_NAV = [
  { icon: DashboardIcon, label: 'Dashboard',   path: '/carrier/dashboard' },
  { icon: SearchIcon,    label: 'Load Board',  path: '/carrier/loads' },
  { icon: ActivityIcon,  label: 'In Progress', path: '/carrier/active' },
  { icon: WalletIcon,    label: 'Payments',    path: '/carrier/payments' },
  { icon: TrendingUpIcon,label: 'Analytics',   path: '/carrier/analytics' },
];

const BROKER_NAV = [
  { icon: DashboardIcon, label: 'Dashboard',   path: '/broker/dashboard' },
  { icon: AddIcon,       label: 'Post Load',   path: '/broker/post' },
  { icon: PackageIcon,   label: 'Loads',       path: '/broker/loads' },
  { icon: EventIcon,     label: 'Bookings',    path: '/broker/bookings' },
  { icon: PaymentIcon,   label: 'Payments',    path: '/broker/payments' },
  { icon: BarChartIcon,  label: 'Analytics',   path: '/broker/analytics' },
];

const ADMIN_NAV = [
  { icon: DashboardIcon,  label: 'Overview',  path: '/admin' },
  { icon: UsersIcon,      label: 'Users',     path: '/admin/users' },
  { icon: PackageIcon,    label: 'Loads',     path: '/admin/loads' },
  { icon: MoneyIcon,      label: 'Revenue',   path: '/admin/revenue' },
  { icon: PaymentIcon,    label: 'Payments',  path: '/admin/payments' },
  { icon: ListChecksIcon, label: 'Waitlist',  path: '/admin/waitlist' },
];

// ── Single top nav link ───────────────────────────────────────────────────────
function NavLink({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        height: '100%',
        cursor: 'pointer',
        position: 'relative',
        userSelect: 'none',
        color: active ? '#fff' : 'rgba(255,255,255,0.72)',
        bgcolor: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        '&:hover': { bgcolor: BAR_COLOR_HOVER, color: '#fff' },
        transition: 'all 0.15s',
        minWidth: 0,
        flexShrink: 0,
        '&::after': active ? {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 8,
          right: 8,
          height: 3,
          borderRadius: '3px 3px 0 0',
          bgcolor: '#fff',
        } : {},
      }}
    >
      <Icon sx={{ fontSize: 16, mb: 0.25 }} />
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {item.label}
      </Typography>
    </Box>
  );
}

// ── Notifications panel content ───────────────────────────────────────────────
function NotificationsPanel({ onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetches = [];

    fetches.push(
      messagesApi.unreadCount()
        .then(d => d.unread > 0 ? [{
          key: 'messages',
          icon: <ChatIcon fontSize="small" color="primary" />,
          primary: `${d.unread} unread message${d.unread !== 1 ? 's' : ''}`,
          secondary: 'Open Message Center',
          path: `/${user.role}/messages`,
          color: 'primary',
        }] : [])
        .catch(() => [])
    );

    if (user.role === 'broker') {
      fetches.push(
        bookingsApi.pending()
          .then(d => {
            const pending = Array.isArray(d) ? d.filter(b => b.status === 'pending') : [];
            return pending.length > 0 ? [{
              key: 'bookings',
              icon: <PendingIcon fontSize="small" color="warning" />,
              primary: `${pending.length} pending booking request${pending.length !== 1 ? 's' : ''}`,
              secondary: 'Review booking requests',
              path: '/broker/bookings',
              color: 'warning',
            }] : [];
          })
          .catch(() => [])
      );
    }

    if (user.role === 'carrier') {
      fetches.push(
        networkApi.requests()
          .then(d => {
            const reqs = Array.isArray(d) ? d : [];
            return reqs.length > 0 ? [{
              key: 'network',
              icon: <NetworkIcon fontSize="small" color="info" />,
              primary: `${reqs.length} network request${reqs.length !== 1 ? 's' : ''}`,
              secondary: 'View connection requests',
              path: '/carrier/network',
              color: 'info',
            }] : [];
          })
          .catch(() => [])
      );

      fetches.push(
        bidsApi.my()
          .then(d => {
            const countered = Array.isArray(d) ? d.filter(b => b.status === 'countered') : [];
            return countered.length > 0 ? [{
              key: 'bids',
              icon: <CheckIcon fontSize="small" color="success" />,
              primary: `${countered.length} counter-offer${countered.length !== 1 ? 's' : ''} received`,
              secondary: 'Review your bids',
              path: '/carrier/active',
              color: 'success',
            }] : [];
          })
          .catch(() => [])
      );
    }

    Promise.all(fetches)
      .then(results => setItems(results.flat()))
      .finally(() => setLoading(false));
  }, [user]);

  const totalCount = items.length;

  return (
    <Box sx={{ width: NOTIF_DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BellIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
          {totalCount > 0 && (
            <Chip label={totalCount} size="small" color="error" sx={{ height: 18, fontSize: '0.7rem' }} />
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Items */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Loading…</Typography>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="body1" fontWeight={600}>You're all caught up!</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>No pending actions right now.</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((item, i) => (
              <Box key={item.key}>
                {i > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => { navigate(item.path); onClose(); }}
                  sx={{ px: 2.5, py: 1.75, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{item.primary}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{item.secondary}</Typography>}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar({ totalNotifCount = 0 }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const searchRef = useRef(null);

  // Fetch notification count
  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      let count = 0;
      try { const d = await messagesApi.unreadCount(); count += d.unread || 0; } catch (_) {}
      if (user.role === 'broker') {
        try { const d = await bookingsApi.pending(); count += Array.isArray(d) ? d.filter(b => b.status === 'pending').length : 0; } catch (_) {}
      }
      if (user.role === 'carrier') {
        try { const d = await networkApi.requests(); count += Array.isArray(d) ? d.length : 0; } catch (_) {}
      }
      setNotifCount(count);
    };
    fetchCounts();
  }, [user, location.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  if (!user) return null;

  const nav = user.role === 'carrier' ? CARRIER_NAV
            : user.role === 'broker'  ? BROKER_NAV
            : ADMIN_NAV;

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: BAR_COLOR,
          color: '#fff',
          height: 52,
          flexShrink: 0,
          zIndex: theme.zIndex.appBar,
          borderRadius: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        <Toolbar disableGutters sx={{ height: 52, minHeight: '52px !important', px: 0 }}>

          {/* Nav links — scrollable */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              height: 52,
              flexGrow: 1,
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
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

          {/* Right side: search + notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, gap: 0.5, flexShrink: 0 }}>
            {/* Inline search */}
            {searchOpen ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 1,
                px: 1.5,
                height: 32,
                mr: 0.5,
              }}>
                <SearchIcon sx={{ fontSize: 16, mr: 0.75, opacity: 0.8 }} />
                <InputBase
                  inputRef={searchRef}
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="Search…"
                  sx={{
                    color: '#fff',
                    fontSize: '0.8rem',
                    width: 160,
                    '& input::placeholder': { color: 'rgba(255,255,255,0.65)', opacity: 1 },
                  }}
                />
                <IconButton size="small" onClick={() => { setSearchOpen(false); setSearchVal(''); }} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ) : (
              <Tooltip title="Search" placement="bottom">
                <IconButton onClick={() => setSearchOpen(true)} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Notifications bell */}
            <Tooltip title="Notifications" placement="bottom">
              <IconButton
                onClick={() => setNotifOpen(true)}
                size="small"
                sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: BAR_COLOR_HOVER } }}
              >
                <Badge badgeContent={notifCount > 0 ? (notifCount > 9 ? '9+' : notifCount) : null} color="error" max={9}>
                  <BellIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications slide-in drawer */}
      <Drawer
        anchor="right"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        PaperProps={{ sx: { width: NOTIF_DRAWER_WIDTH, borderRadius: 0 } }}
      >
        <NotificationsPanel onClose={() => setNotifOpen(false)} />
      </Drawer>
    </>
  );
}
