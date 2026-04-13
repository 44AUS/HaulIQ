import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TuneIcon from '@mui/icons-material/Tune';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import { useAuth } from '../../context/AuthContext';
import BrandingSettings from './BrandingSettings';
import Equipment from '../carrier/Equipment';

const CARDS = [
  { key: 'branding',      icon: PaletteIcon,       title: 'Branding',       desc: 'Customize your navigation bar color and visual identity.',   available: true },
  { key: 'notifications', icon: NotificationsIcon,  title: 'Notifications',  desc: 'Control which email and push alerts you receive.',          available: false },
  { key: 'equipment',     icon: LocalShippingIcon,  title: 'Equipment',      desc: 'Add and manage your trucks, trailers, and load capacity.',  available: true, carrierOnly: true },
  { key: 'documents',     icon: DescriptionIcon,    title: 'Documents',      desc: 'Upload your CDL, MC authority, insurance, and more.',       available: false },
  { key: 'billing',       icon: CreditCardIcon,     title: 'Billing',        desc: 'Manage your subscription plan and payment method.',         available: false },
  { key: 'privacy',       icon: PrivacyTipIcon,     title: 'Privacy',        desc: 'Control your data sharing and profile visibility.',        available: false },
  { key: 'security',      icon: SecurityIcon,       title: 'Security',       desc: 'Manage trusted devices and login activity.',                available: false },
  { key: 'support',       icon: SupportAgentIcon,   title: 'Support',        desc: 'Get help, submit a ticket, or browse the help center.',    available: false },
];

function ComingSoon({ label }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 1.5 }}>
      <TuneIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
      <Typography variant="h6" fontWeight={600} color="text.secondary">{label}</Typography>
      <Typography variant="body2" color="text.disabled">Coming soon</Typography>
    </Box>
  );
}

function AllCards({ user, onSelect }) {
  const cards = CARDS.filter(c => !c.carrierOnly || user?.role === 'carrier');
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2, p: 3 }}>
      {cards.map(card => (
        <Card
          key={card.key}
          variant="outlined"
          sx={{
            height: '100%',
            opacity: card.available ? 1 : 0.55,
            transition: 'all 0.15s',
            ...(card.available && { '&:hover': { borderColor: 'primary.main', boxShadow: 3, cursor: 'pointer' } }),
          }}
        >
          {card.available ? (
            <CardActionArea onClick={() => onSelect(card.key)} sx={{ height: '100%', alignItems: 'flex-start' }}>
              <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                  <card.icon sx={{ fontSize: 22, color: 'primary.main' }} />
                  <Typography variant="subtitle2" fontWeight={700}>{card.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.8rem' }}>
                  {card.desc}
                </Typography>
              </CardContent>
            </CardActionArea>
          ) : (
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                <card.icon sx={{ fontSize: 22, color: 'text.disabled' }} />
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{card.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.8rem' }}>{card.desc}</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 'auto', pt: 1.5 }}>Coming soon</Typography>
            </CardContent>
          )}
        </Card>
      ))}
    </Box>
  );
}

export default function Preferences() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const activeTab = searchParams.get('tab') || 'all';

  const goToTab = (key) => setSearchParams({ tab: key }, { replace: true });

  return (
    <Box sx={{ height: '100%' }}>
      {activeTab === 'all'          && <AllCards user={user} onSelect={goToTab} />}
      {activeTab === 'branding'     && <BrandingSettings embedded />}
      {activeTab === 'equipment'    && user?.role === 'carrier' && <Equipment />}
      {activeTab === 'equipment'    && user?.role !== 'carrier' && <ComingSoon label="Equipment" />}
      {activeTab === 'notifications'&& <ComingSoon label="Notifications" />}
      {activeTab === 'documents'    && <ComingSoon label="Documents" />}
      {activeTab === 'billing'      && <ComingSoon label="Billing" />}
      {activeTab === 'privacy'      && <ComingSoon label="Privacy" />}
      {activeTab === 'security'     && <ComingSoon label="Security" />}
      {activeTab === 'support'      && <ComingSoon label="Support" />}
    </Box>
  );
}
