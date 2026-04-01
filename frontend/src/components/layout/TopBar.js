import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Typography, InputBase, Drawer,
  Divider, Badge, Tooltip, List, ListItem, ListItemIcon, ListItemText,
  Chip, useTheme, useMediaQuery, Menu, MenuItem, Skeleton, Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
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
  CheckCircleOutline as CheckIcon,
  PendingActions as PendingIcon,
  NetworkCheck as NetworkIcon,
  MoreVert as MoreVertIcon,
  Layers as LayersIcon,
  LocalShipping as TruckIcon,
  Person as PersonIcon,
  Message as MsgIcon,
  Bookmark as SavedIcon,
  CheckCircle as DoneIcon,
  LocalAtm as PayIcon,
  EventNote as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { messagesApi, bookingsApi, networkApi, bidsApi, searchApi } from '../../services/api';

const DEFAULT_BAR_COLOR = '#1565C0';
const BAR_COLOR_HOVER = 'rgba(255,255,255,0.12)';
const NOTIF_DRAWER_WIDTH = 360;

// ── Role nav configs ──────────────────────────────────────────────────────────
const CARRIER_NAV = [
  { icon: CalendarIcon,  label: 'Calendar',    path: '/carrier/calendar' },
  { icon: SearchIcon,    label: 'Load Board',  path: '/carrier/loads' },
  { icon: ActivityIcon,  label: 'In Progress', path: '/carrier/active' },
  { icon: WalletIcon,    label: 'Payments',    path: '/carrier/payments' },
  { icon: TrendingUpIcon,label: 'Analytics',   path: '/carrier/analytics' },
  { icon: TruckIcon,     label: 'My Trucks',   path: '/carrier/equipment' },
];

const BROKER_NAV = [
  { icon: CalendarIcon,  label: 'Calendar',    path: '/broker/calendar' },
  { icon: AddIcon,       label: 'Post Load',   path: '/broker/post' },
  { icon: PackageIcon,   label: 'Loads',       path: '/broker/loads' },
  { icon: EventIcon,     label: 'Bookings',    path: '/broker/bookings' },
  { icon: PaymentIcon,   label: 'Payments',    path: '/broker/payments' },
  { icon: BarChartIcon,  label: 'Analytics',   path: '/broker/analytics' },
  { icon: TruckIcon,     label: 'Trucks',      path: '/broker/trucks' },
];

const ADMIN_NAV = [
  { icon: DashboardIcon,  label: 'Overview',  path: '/admin' },
  { icon: UsersIcon,      label: 'Users',     path: '/admin/users' },
  { icon: PackageIcon,    label: 'Loads',     path: '/admin/loads' },
  { icon: MoneyIcon,      label: 'Revenue',   path: '/admin/revenue' },
  { icon: PaymentIcon,    label: 'Payments',  path: '/admin/payments' },
  { icon: ListChecksIcon, label: 'Waitlist',  path: '/admin/waitlist' },
  { icon: LayersIcon,     label: 'Plans',     path: '/admin/plans' },
  { icon: TruckIcon,     label: 'Equipment', path: '/admin/equipment' },
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
          left: 8,
          right: 8,
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

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar({ sidebarOpen, onToggleSidebar }) {
  const { user } = useAuth();
  const { brandColor } = useThemeMode();
  const barColor = brandColor || DEFAULT_BAR_COLOR;
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const searchRef = useRef(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchPanelRef = useRef(null);

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
        <NotificationsPanel onClose={() => setNotifOpen(false)} />
      </Drawer>
    </>
  );
}
