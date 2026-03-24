import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessIcon from '@mui/icons-material/Business';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import TuneIcon from '@mui/icons-material/Tune';
import { useAuth } from '../../context/AuthContext';

const CARRIER_CARDS = [
  { icon: PaletteIcon,   title: 'Branding',       desc: 'Customize your navigation bar color and visual identity.',  path: '/settings/branding', active: true },
  { icon: PersonIcon,    title: 'Profile',         desc: 'Update your name, contact info, and account details.',      path: '/settings/profile',   active: true },
  { icon: LockIcon,      title: 'Security',        desc: 'Change your password and manage login security.',           path: '/settings/profile',   active: true },
  { icon: NotificationsIcon, title: 'Notifications', desc: 'Control which email and push alerts you receive.',        path: null },
  { icon: LocalShippingIcon, title: 'Equipment',   desc: 'Add and manage your trucks, trailers, and load capacity.', path: null },
  { icon: DescriptionIcon,   title: 'Documents',   desc: 'Upload your CDL, MC authority, insurance, and more.',      path: null },
  { icon: CreditCardIcon,    title: 'Billing',     desc: 'Manage your subscription plan and payment method.',        path: null },
  { icon: SecurityIcon,      title: 'Privacy',     desc: 'Control your data sharing and visibility settings.',       path: null },
  { icon: SupportAgentIcon,  title: 'Support',     desc: 'Get help, submit a ticket, or browse the help center.',    path: null },
];

const BROKER_CARDS = [
  { icon: PaletteIcon,   title: 'Branding',       desc: 'Customize your navigation bar color and visual identity.',  path: '/settings/branding', active: true },
  { icon: PersonIcon,    title: 'Profile',         desc: 'Update your name, contact info, and account details.',      path: '/settings/profile',   active: true },
  { icon: BusinessIcon,  title: 'Company',         desc: 'Set your company name, DOT/MC number, and business info.', path: null },
  { icon: NotificationsIcon, title: 'Notifications', desc: 'Control which email and push alerts you receive.',        path: null },
  { icon: TuneIcon,      title: 'Load Defaults',   desc: 'Set default values for new load postings.',                path: null },
  { icon: DescriptionIcon,   title: 'Documents',   desc: 'Upload broker authority, W-9, and compliance documents.',  path: null },
  { icon: CreditCardIcon,    title: 'Billing',     desc: 'Manage your subscription plan and payment method.',        path: null },
  { icon: IntegrationInstructionsIcon, title: 'Integrations', desc: 'Connect your TMS, ELD, or third-party tools.', path: null },
  { icon: SupportAgentIcon,  title: 'Support',     desc: 'Get help, submit a ticket, or browse the help center.',    path: null },
];

function SettingCard({ icon: Icon, title, desc, path, onClick }) {
  const content = (
    <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
        <Icon sx={{ fontSize: 22, color: path ? 'primary.main' : 'text.disabled' }} />
        <Typography variant="subtitle2" fontWeight={700} color={path ? 'text.primary' : 'text.secondary'}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.8rem' }}>
        {desc}
      </Typography>
      {!path && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 'auto', pt: 1.5 }}>
          Coming soon
        </Typography>
      )}
    </CardContent>
  );

  if (path) {
    return (
      <Card variant="outlined" sx={{ height: '100%', '&:hover': { borderColor: 'primary.main', boxShadow: 2 }, transition: 'all 0.15s' }}>
        <CardActionArea onClick={onClick} sx={{ height: '100%', alignItems: 'flex-start' }}>
          {content}
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ height: '100%', opacity: 0.6 }}>
      {content}
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = user?.role === 'broker' ? BROKER_CARDS : CARRIER_CARDS;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Preferences</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your account settings and customize your HaulIQ experience.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {cards.map(card => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <SettingCard
              {...card}
              onClick={() => card.path && navigate(card.path)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
