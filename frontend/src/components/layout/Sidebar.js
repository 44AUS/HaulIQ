import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Badge, Tooltip, useMediaQuery, useTheme,
  Switch, Stack,
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
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Message as MessageIcon,
  Event as EventIcon,
  FlashOn as ZapIcon,
  ShowChart as ActivityIcon,
  Hub as NetworkIcon,
  ListAlt as ListChecksIcon,
  LocalShipping as TruckIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { messagesApi, bookingsApi, networkApi } from '../../services/api';

export const DRAWER_WIDTH = 260;
export const DRAWER_COLLAPSED_WIDTH = 72;

const CARRIER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard',        path: '/carrier/dashboard' },
  { icon: SearchIcon,    label: 'Load Board',        path: '/carrier/loads' },
  { icon: CalculateIcon, label: 'Profit Calculator', path: '/carrier/calculator' },
  { icon: BrainIcon,     label: 'Earnings Brain',    path: '/carrier/brain' },
  { icon: BookmarkIcon,  label: 'Saved Loads',       path: '/carrier/saved' },
  { icon: HistoryIcon,   label: 'Load History',      path: '/carrier/history' },
  { icon: ActivityIcon,  label: 'In Progress',       path: '/carrier/active' },
  { icon: TrendingUpIcon,label: 'Analytics',         path: '/carrier/analytics' },
  { icon: NetworkIcon,   label: 'Network',           path: '/carrier/network', badge: 'network' },
  { icon: MessageIcon,   label: 'Messages',          path: '/carrier/messages', badge: 'unread' },
];

const BROKER_LINKS = [
  { icon: DashboardIcon, label: 'Dashboard',         path: '/broker/dashboard' },
  { icon: AddIcon,       label: 'Post Load',         path: '/broker/post' },
  { icon: PackageIcon,   label: 'Manage Loads',      path: '/broker/loads' },
  { icon: ActivityIcon,  label: 'In Progress',       path: '/broker/active' },
  { icon: BarChartIcon,  label: 'Analytics',         path: '/broker/analytics' },
  { icon: NetworkIcon,   label: 'Network',           path: '/broker/network' },
  { icon: MessageIcon,   label: 'Messages',          path: '/broker/messages', badge: 'unread' },
  { icon: EventIcon,     label: 'Booking Requests',  path: '/broker/bookings', badge: 'bookings' },
  { icon: ZapIcon,       label: 'Instant Book',      path: '/broker/instant-book' },
];

const ADMIN_LINKS = [
  { icon: DashboardIcon,  label: 'Overview',          path: '/admin' },
  { icon: UsersIcon,      label: 'Users',             path: '/admin/users' },
  { icon: PackageIcon,    label: 'Load Moderation',   path: '/admin/loads' },
  { icon: CreditCardIcon, label: 'Subscriptions',     path: '/admin/subscriptions' },
  { icon: MoneyIcon,      label: 'Revenue',           path: '/admin/revenue' },
  { icon: ListChecksIcon, label: 'Waitlist',          path: '/admin/waitlist' },
];

function NavItem({ item, collapsed, badgeCount, active, onClick }) {
  const btn = (
    <ListItemButton
      selected={active}
      onClick={onClick}
      sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      <ListItemIcon sx={{ justifyContent: 'center', minWidth: collapsed ? 0 : 36 }}>
        <Badge badgeContent={badgeCount > 0 ? (badgeCount > 9 ? '9+' : badgeCount) : null} color="error" max={9}>
          <item.icon fontSize="small" />
        </Badge>
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
        />
      )}
    </ListItemButton>
  );

  if (collapsed) {
    return (
      <ListItem disablePadding>
        <Tooltip title={item.label} placement="right">
          {btn}
        </Tooltip>
      </ListItem>
    );
  }
  return <ListItem disablePadding>{btn}</ListItem>;
}

function SidebarContent({ collapsed, onNavigate, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
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
      {/* Logo */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2, py: 2, minHeight: 64,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TruckIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          {!collapsed && (
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
              Haul<Box component="span" sx={{ color: 'primary.light' }}>IQ</Box>
            </Typography>
          )}
        </Box>
        {!collapsed && onToggleCollapse && (
          <IconButton onClick={onToggleCollapse} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
        {collapsed && onToggleCollapse && (
          <IconButton onClick={onToggleCollapse} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' }, mt: 0.5 }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      {/* User card */}
      {!collapsed && (
        <Box sx={{ mx: 1.5, mt: 2, mb: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {user.avatar || user.name?.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#fff' }}>
                {user.name?.split(' ')[0]}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                {user.role} · <Box component="span" sx={{ color: 'primary.light' }}>{user.plan}</Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Nav */}
      <List dense sx={{ flexGrow: 1, px: 0.5, overflowY: 'auto', mt: collapsed ? 1 : 0 }}>
        {links.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            badgeCount={item.badge ? getBadge(item.badge) : 0}
            active={isActive(item.path)}
            onClick={() => handleNav(item.path)}
          />
        ))}
      </List>

      {/* Bottom */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />
      <List dense sx={{ px: 0.5, pb: 1 }}>
        {/* Theme toggle */}
        <ListItem sx={{ px: 1.5, py: 0.5 }}>
          {collapsed ? (
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
              <IconButton size="small" onClick={toggleTheme} sx={{ color: 'rgba(255,255,255,0.5)', mx: 'auto' }}>
                {mode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <DarkIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', flexGrow: 1 }}>
                {mode === 'dark' ? 'Dark mode' : 'Light mode'}
              </Typography>
              <Switch
                size="small"
                checked={mode === 'dark'}
                onChange={toggleTheme}
                sx={{
                  '& .MuiSwitch-thumb': { bgcolor: mode === 'dark' ? 'primary.light' : '#fff' },
                  '& .MuiSwitch-track': { bgcolor: mode === 'dark' ? 'primary.main' : 'rgba(255,255,255,0.2)' },
                }}
              />
            </Stack>
          )}
        </ListItem>

        <NavItem
          item={{ icon: SettingsIcon, label: 'Settings', path: '/settings' }}
          collapsed={collapsed}
          badgeCount={0}
          active={location.pathname === '/settings'}
          onClick={() => handleNav('/settings')}
        />
        <ListItem disablePadding>
          {collapsed ? (
            <Tooltip title="Sign out" placement="right">
              <ListItemButton onClick={handleLogout} sx={{ justifyContent: 'center', color: 'error.light', '&:hover': { bgcolor: 'rgba(239,83,80,0.1)' } }}>
                <ListItemIcon sx={{ justifyContent: 'center', minWidth: 0, color: 'inherit' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, color: 'error.light', '&:hover': { bgcolor: 'rgba(239,83,80,0.1)' } }}>
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          )}
        </ListItem>
      </List>
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse, onMobileOpen }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const drawerSx = {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: drawerWidth,
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
      {/* Mobile hamburger */}
      {isMobile && (
        <IconButton
          onClick={onMobileOpen}
          sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300, bgcolor: 'background.paper', boxShadow: 2 }}
          size="small"
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose} ModalProps={{ keepMounted: true }} sx={{ ...drawerSx, display: { xs: 'block', lg: 'none' } }}>
          <SidebarContent collapsed={false} onNavigate={onMobileClose} />
        </Drawer>
      )}

      {/* Desktop drawer */}
      {!isMobile && (
        <Drawer variant="permanent" sx={{ ...drawerSx, display: { xs: 'none', lg: 'block' } }} open>
          <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
        </Drawer>
      )}
    </>
  );
}
