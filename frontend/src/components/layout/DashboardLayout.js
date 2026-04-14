import { useState, createContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import TopBar from './TopBar';

export const LayoutContext = createContext({ drawerWidth: DRAWER_WIDTH });

const NETWORK_PATHS   = ['/carrier/network',    '/broker/network'];
const BILLING_PATHS   = ['/carrier/billing',    '/broker/billing'];
const MESSAGES_PATHS  = ['/carrier/messages',   '/broker/messages',  '/driver/messages'];
const ANALYTICS_PATHS = ['/carrier/analytics',  '/broker/analytics'];
const TOOLS_PATHS     = ['/carrier/tools'];
const DRIVERS_PATHS   = ['/carrier/drivers'];
const PREFERENCES_PATHS = ['/preferences'];

const isLoadDetail = (path) =>
  /^\/carrier\/loads\/[^/]+$/.test(path) ||
  /^\/carrier\/active\/[^/]+$/.test(path);

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const immersiveMode = NETWORK_PATHS.includes(location.pathname)   ? 'network'
    : BILLING_PATHS.includes(location.pathname)   ? 'billing'
    : MESSAGES_PATHS.includes(location.pathname)  ? 'messages'
    : ANALYTICS_PATHS.includes(location.pathname) ? 'analytics'
    : TOOLS_PATHS.includes(location.pathname)     ? 'tools'
    : DRIVERS_PATHS.includes(location.pathname)     ? 'drivers'
    : PREFERENCES_PATHS.includes(location.pathname) ? 'preferences'
    : isLoadDetail(location.pathname) ? 'load_detail'
    : null;
  const drawerWidth = isMobile || immersiveMode ? 0 : (sidebarOpen ? DRAWER_WIDTH : 0);

  return (
    <LayoutContext.Provider value={{ drawerWidth }}>
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {!immersiveMode && (
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onMobileOpen={() => setMobileOpen(true)}
        />
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar
          sidebarOpen={!immersiveMode && sidebarOpen}
          onToggleSidebar={() => isMobile ? setMobileOpen(o => !o) : setSidebarOpen(o => !o)}
          immersiveMode={immersiveMode}
        />
        {/* Scroll container */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3, lg: 4 }, width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
    </LayoutContext.Provider>
  );
}
