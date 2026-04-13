import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useAuth } from '../../context/AuthContext';
import BrandingSettings from './BrandingSettings';
import Equipment from '../carrier/Equipment';

function ComingSoon({ label }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 1.5 }}>
      <TuneIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
      <Typography variant="h6" fontWeight={600} color="text.secondary">{label}</Typography>
      <Typography variant="body2" color="text.disabled">Coming soon</Typography>
    </Box>
  );
}

export default function Preferences() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const activeTab = searchParams.get('tab') || 'branding';

  return (
    <Box sx={{ height: '100%' }}>
      {activeTab === 'branding'      && <BrandingSettings embedded />}
      {activeTab === 'equipment'     && user?.role === 'carrier' && <Equipment />}
      {activeTab === 'equipment'     && user?.role !== 'carrier' && <ComingSoon label="Equipment" />}
      {activeTab === 'notifications' && <ComingSoon label="Notifications" />}
      {activeTab === 'documents'     && <ComingSoon label="Documents" />}
      {activeTab === 'billing'       && <ComingSoon label="Billing" />}
      {activeTab === 'privacy'       && <ComingSoon label="Privacy" />}
      {activeTab === 'security'      && <ComingSoon label="Security" />}
      {activeTab === 'support'       && <ComingSoon label="Support" />}
    </Box>
  );
}
