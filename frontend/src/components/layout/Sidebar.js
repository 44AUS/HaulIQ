import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Badge, Tooltip, useMediaQuery, useTheme,
  Button, alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Calculate as CalculateIcon,
  Psychology as BrainIcon,
  Bookmark as BookmarkIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  AddCircleOutline as AddIcon,
  Inventory2 as PackageIcon,
  Group as UsersIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
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
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { messagesApi, bookingsApi, networkApi } from '../../services/api';

export const DRAWER_WIDTH = 280;
export const DRAWER_COLLAPSED_WIDTH = 72; // kept for any external imports

const CARRIER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard',        path: '/carrier/dashboard' },
  { icon: SearchIcon,    label: 'Load Board',        path: '/carrier/loads' },
  { icon: CalculateIcon, label: 'Profit Calculator', path: '/carrier/calculator' },
  { icon: BrainIcon,     label: 'Earnings Brain',    path: '/carrier/brain' },
  { icon: BookmarkIcon,  label: 'Saved Loads',       path: '/carrier/saved' },
  { icon: HistoryIcon,   label: 'Load History',      path: '/carrier/history' },
  { icon: ActivityIcon,  label: 'In Progress',       path: '/carrier/active' },
  { icon: WalletIcon,    label: 'Payments',          path: '/carrier/payments' },
  { icon: TrendingUpIcon,label: 'Analytics',         path: '/carrier/analytics' },
  { icon: NetworkIcon,   label: 'Network',           path: '/carrier/network', badge: 'network' },
  { icon: FolderIcon,    label: 'Documents',         path: '/carrier/documents' },
  { icon: CreditCardIcon,label: 'Billing',           path: '/carrier/billing' },
  { icon: PreferencesIcon,label: 'Preferences',      path: '/preferences' },
];

const BROKER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard',         path: '/broker/dashboard' },
  { icon: AddIcon,       label: 'Post Load',         path: '/broker/post' },
  { icon: PackageIcon,   label: 'Manage Loads',      path: '/broker/loads' },
  { icon: ActivityIcon,  label: 'In Progress',       path: '/broker/active' },
  { icon: BarChartIcon,  label: 'Analytics',         path: '/broker/analytics' },
  { icon: NetworkIcon,   label: 'Network',           path: '/broker/network' },
  { icon: FolderIcon,    label: 'Documents',         path: '/broker/documents' },
  { icon: EventIcon,     label: 'Booking Requests',  path: '/broker/bookings', badge: 'bookings' },
  { icon: ZapIcon,       label: 'Instant Book',      path: '/broker/instant-book' },
  { icon: PaymentIcon,   label: 'Payments',          path: '/broker/payments' },
  { icon: CreditCardIcon,label: 'Billing',           path: '/broker/billing' },
  { icon: PreferencesIcon,label: 'Preferences',      path: '/preferences' },
];

const ADMIN_LINKS = [
  { icon: DashboardIcon,  label: 'Overview',          path: '/admin' },
  { icon: UsersIcon,      label: 'Users',             path: '/admin/users' },
  { icon: PackageIcon,    label: 'Load Moderation',   path: '/admin/loads' },
  { icon: CreditCardIcon, label: 'Subscriptions',     path: '/admin/subscriptions' },
  { icon: MoneyIcon,      label: 'Revenue',           path: '/admin/revenue' },
  { icon: PaymentIcon,    label: 'Payments',          path: '/admin/payments' },
  { icon: ListChecksIcon, label: 'Waitlist',          path: '/admin/waitlist' },
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
  const { user, logout } = useAuth();
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
              : ADMIN_LINKS;

  const messagesPath = user.role === 'carrier' ? '/carrier/messages'
                     : user.role === 'broker'  ? '/broker/messages'
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
  const handleLogout = () => { onNavigate?.(); logout(); navigate('/'); };

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

      <Divider sx={{ borderColor: sc.divider }} />

      {/* User info */}
      <Box sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={user.avatar_url || undefined} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
            {!user.avatar_url && (user.avatar || user.name?.charAt(0))}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={700} noWrap sx={{ color: sc.nameColor, lineHeight: 1.3 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: sc.subtitleColor, textTransform: 'capitalize' }}>
              {user.role} · <Box component="span" sx={{ color: sc.planColor }}>{user.plan}</Box>
            </Typography>
          </Box>
        </Box>
      </Box>

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

      {/* Bottom */}
      <Divider sx={{ borderColor: sc.divider }} />
      <List dense disablePadding>
        <Divider sx={{ borderColor: sc.dividerFaint }} />
        <NavItem
          item={{ icon: SettingsIcon, label: 'Settings', path: '/settings' }}
          badgeCount={0}
          active={location.pathname === '/settings'}
          onClick={() => handleNav('/settings')}
        />
        <Divider sx={{ borderColor: sc.dividerFaint }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '0 !important',
              px: 2.5,
              py: 1.25,
              color: sc.logoutColor,
              '&:hover': { bgcolor: sc.logoutHoverBg, color: sc.logoutHoverColor },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: '0.875rem' }} />
          </ListItemButton>
        </ListItem>
      </List>
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
