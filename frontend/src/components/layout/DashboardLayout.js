import { useState, createContext } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { DRAWER_WIDTH, DRAWER_COLLAPSED_WIDTH } from './Sidebar';
import TopBar from './TopBar';

export const LayoutContext = createContext({ drawerWidth: DRAWER_WIDTH });

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = isMobile ? 0 : (collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH);

  return (
    <LayoutContext.Provider value={{ drawerWidth }}>
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onMobileOpen={() => setMobileOpen(true)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: isMobile ? 6 : 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar />
        {/* Scroll container — pages scroll here, not the viewport */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3, lg: 4 }, width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
    </LayoutContext.Provider>
  );
}
