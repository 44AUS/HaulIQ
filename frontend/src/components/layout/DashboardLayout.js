import { createContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IonContent, IonMenu, IonPage, IonSplitPane } from '@ionic/react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export const DRAWER_WIDTH = 300;
export const LayoutContext = createContext({ drawerWidth: DRAWER_WIDTH });

const NETWORK_PATHS   = ['/carrier/network',    '/broker/network'];
const BILLING_PATHS   = ['/carrier/billing',    '/broker/billing'];
const MESSAGES_PATHS  = ['/carrier/messages',   '/broker/messages',  '/driver/messages'];
const ANALYTICS_PATHS = ['/carrier/analytics',  '/broker/analytics'];
const TOOLS_PATHS     = ['/carrier/tools'];
const DRIVERS_PATHS   = ['/carrier/drivers'];
const PREFERENCES_PATHS = ['/preferences'];
const PROFILE_PATHS     = ['/profile'];
const BUSINESS_PATHS    = ['/business'];
const SETTINGS_PATHS    = ['/settings'];

const COMPACT_PADDING_PATHS = [
  '/carrier/calendar', '/broker/calendar',
  '/carrier/loads', '/broker/loads', '/driver/loads',
  '/broker/active', '/carrier/job-manager',
  '/carrier/payments', '/broker/payments',
  '/broker/trucks', '/carrier/equipment',
];

const isLoadDetail      = (p) => /^\/carrier\/loads\/[^/]+$/.test(p) || /^\/carrier\/active\/[^/]+$/.test(p);
const isCarrierProfile  = (p) => /^\/c\/[^/]+$/.test(p);
const isBrokerProfile   = (p) => /^\/b\/[^/]+$/.test(p);

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const compactPadding = COMPACT_PADDING_PATHS.includes(location.pathname);

  const immersiveMode = NETWORK_PATHS.includes(location.pathname)    ? 'network'
    : BILLING_PATHS.includes(location.pathname)    ? 'billing'
    : MESSAGES_PATHS.includes(location.pathname)   ? 'messages'
    : ANALYTICS_PATHS.includes(location.pathname)  ? 'analytics'
    : TOOLS_PATHS.includes(location.pathname)      ? 'tools'
    : DRIVERS_PATHS.includes(location.pathname)    ? 'drivers'
    : PREFERENCES_PATHS.includes(location.pathname)? 'preferences'
    : PROFILE_PATHS.includes(location.pathname)    ? 'profile'
    : BUSINESS_PATHS.includes(location.pathname)   ? 'business'
    : SETTINGS_PATHS.includes(location.pathname)  ? 'settings'
    : isLoadDetail(location.pathname)              ? 'load_detail'
    : isCarrierProfile(location.pathname)          ? 'carrier_profile'
    : isBrokerProfile(location.pathname)           ? 'broker_profile'
    : null;

  const padding = compactPadding ? '10px' : '24px';

  // Immersive pages: full-width, no sidebar
  if (immersiveMode) {
    return (
      <LayoutContext.Provider value={{ drawerWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--ion-background-color)' }}>
          <TopBar immersiveMode={immersiveMode} />
          <div style={{ flex: 1, overflowY: 'auto', padding }}>
            {children}
          </div>
        </div>
      </LayoutContext.Provider>
    );
  }

  // Normal pages: IonSplitPane with sidebar
  return (
    <LayoutContext.Provider value={{ drawerWidth: DRAWER_WIDTH }}>
      <IonSplitPane contentId="main-content" when={sidebarOpen ? 'lg' : '(max-width: -1px)'} style={{ '--side-max-width': `${DRAWER_WIDTH}px`, '--side-min-width': `${DRAWER_WIDTH}px` }}>
        {/* Sidebar */}
        <IonMenu contentId="main-content" menuId="main-menu" type="overlay" style={{ '--width': `${DRAWER_WIDTH}px` }}>
          <IonContent>
            <Sidebar onNavigate={() => {}} onClose={() => setSidebarOpen(false)} />
          </IonContent>
        </IonMenu>

        {/* Main content */}
        <IonPage id="main-content">
          <TopBar onToggleSidebar={() => setSidebarOpen(o => !o)} />
          <IonContent scrollY style={{ '--background': 'var(--ion-background-color)' }}>
            <div style={{ padding }}>
              {children}
            </div>
          </IonContent>
        </IonPage>
      </IonSplitPane>
    </LayoutContext.Provider>
  );
}
