import { useState } from 'react';
import {
import IonIcon from '../../components/IonIcon';

  Box, Typography, Card, CardContent, Chip, Button, Avatar,
  useTheme, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

// ─── Integration definitions ─────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    key: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    description: 'Sync invoices, payments, and expenses directly with QuickBooks Online.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/QuickBooks_logo.svg/512px-QuickBooks_logo.svg.png',
    color: '#2CA01C',
    available: false,
  },
  {
    key: 'samsara',
    name: 'Samsara',
    category: 'Fleet & ELD',
    description: 'Pull live vehicle locations, HOS logs, and driver data from Samsara.',
    logo: null,
    initials: 'SA',
    color: '#FF6B35',
    available: false,
  },
  {
    key: 'motive',
    name: 'Motive (KeepTruckin)',
    category: 'Fleet & ELD',
    description: 'Sync ELD logs, IFTA reports, and driver hours from Motive.',
    logo: null,
    initials: 'MO',
    color: '#0071CE',
    available: false,
  },
  {
    key: 'dat',
    name: 'DAT Load Board',
    category: 'Load Boards',
    description: 'Import and sync loads directly from your DAT account.',
    logo: null,
    initials: 'DAT',
    color: '#E63946',
    available: false,
  },
  {
    key: 'truckstop',
    name: 'Truckstop.com',
    category: 'Load Boards',
    description: 'Automatically pull available loads from Truckstop into HaulIQ.',
    logo: null,
    initials: 'TS',
    color: '#1D3557',
    available: false,
  },
  {
    key: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    description: 'Already connected — HaulIQ uses Stripe to process all payments and payouts.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png',
    color: '#635BFF',
    available: true,
    connected: true,
    managed: true,
  },
  {
    key: 'twilio',
    name: 'Twilio',
    category: 'Messaging',
    description: 'Send automated SMS notifications to drivers and brokers via Twilio.',
    logo: null,
    initials: 'TW',
    color: '#F22F46',
    available: false,
  },
  {
    key: 'google_maps',
    name: 'Google Maps',
    category: 'Mapping',
    description: 'Already connected — powers live tracking, route planning, and map views.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/418px-Google_Maps_icon_%282020%29.svg.png',
    color: '#4285F4',
    available: true,
    connected: true,
    managed: true,
  },
  {
    key: 'mcleod',
    name: 'McLeod Software',
    category: 'TMS',
    description: 'Integrate with McLeod LoadMaster or PowerBroker for advanced TMS workflows.',
    logo: null,
    initials: 'ML',
    color: '#2D6A4F',
    available: false,
  },
  {
    key: 'relay',
    name: 'Relay Payments',
    category: 'Payments',
    description: 'Accept fuel advances and lumper payments through the Relay network.',
    logo: null,
    initials: 'RL',
    color: '#7B2D8B',
    available: false,
  },
  {
    key: 'fourkites',
    name: 'FourKites',
    category: 'Tracking',
    description: 'Real-time shipment visibility and predictive ETAs via FourKites.',
    logo: null,
    initials: 'FK',
    color: '#0080FF',
    available: false,
  },
  {
    key: 'project44',
    name: 'project44',
    category: 'Tracking',
    description: 'Advanced visibility and analytics for your freight network.',
    logo: null,
    initials: 'P44',
    color: '#FF4713',
    available: false,
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))];

// ─── Single card ─────────────────────────────────────────────────────────────
function IntegrationCard({ integration, onLearnMore }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        transition: 'all 0.15s',
        opacity: integration.available ? 1 : 0.72,
        ...(integration.available && !integration.managed && {
          '&:hover': { borderColor: 'primary.main', boxShadow: 4 },
        }),
        borderColor: integration.connected
          ? (isDark ? 'rgba(45,211,111,0.4)' : 'rgba(45,211,111,0.6)')
          : undefined,
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <Avatar
            src={integration.logo || undefined}
            variant="rounded"
            sx={{
              width: 44, height: 44,
              bgcolor: integration.logo ? 'transparent' : integration.color,
              color: '#fff',
              fontSize: integration.initials?.length > 2 ? '0.65rem' : '0.85rem',
              fontWeight: 800,
              flexShrink: 0,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              '& img': { objectFit: 'contain', p: 0.5 },
            }}
          >
            {integration.initials}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }} noWrap>
              {integration.name}
            </Typography>
            <Chip
              label={integration.category}
              size="small"
              sx={{
                mt: 0.4, height: 18, fontSize: '0.65rem', fontWeight: 600,
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: 'text.secondary',
              }}
            />
          </Box>

          {integration.connected && (
            <IonIcon name="checkmark-circle" sx={{ fontSize: 18, color: '#2dd36f', flexShrink: 0, mt: 0.25 }} />
          )}
        </Box>

        {/* Description */}
        <Typography
          sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.55, mb: 2, minHeight: 50 }}
        >
          {integration.description}
        </Typography>

        {/* Footer */}
        {integration.managed ? (
          <Chip
            icon={<IonIcon name="checkmark-circle" sx={{ fontSize: '14px !important' }} />}
            label="Managed by HaulIQ"
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(45,211,111,0.12)' : 'rgba(45,211,111,0.1)',
              color: '#2dd36f',
              fontWeight: 600,
              fontSize: '0.7rem',
              border: '1px solid rgba(45,211,111,0.25)',
            }}
          />
        ) : integration.available ? (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            endIcon={<IonIcon name="open-outline" sx={{ fontSize: '14px !important' }} />}
            onClick={() => onLearnMore(integration)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.78rem', fontWeight: 600 }}
          >
            Connect
          </Button>
        ) : (
          <Chip
            label="Coming Soon"
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: 'text.disabled',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Integrations() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [learnMore, setLearnMore] = useState(null);

  const filtered = INTEGRATIONS.filter(
    i => activeCategory === 'All' || i.category === activeCategory
  );

  const connected = INTEGRATIONS.filter(i => i.connected && !i.managed).length;

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <IonIcon name="extension-puzzle-outline" sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700}>Integrations</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Connect HaulIQ with the tools you already use.
          {connected > 0 && ` ${connected} integration${connected > 1 ? 's' : ''} connected.`}
        </Typography>
      </Box>

      {/* Category filter pills */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {CATEGORIES.map(cat => (
          <Chip
            key={cat}
            label={cat}
            clickable
            onClick={() => setActiveCategory(cat)}
            variant={activeCategory === cat ? 'filled' : 'outlined'}
            color={activeCategory === cat ? 'primary' : 'default'}
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
        ))}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 2,
      }}>
        {filtered.map(integration => (
          <IntegrationCard
            key={integration.key}
            integration={integration}
            onLearnMore={setLearnMore}
          />
        ))}
      </Box>

      {/* Learn more / connect dialog */}
      <Dialog
        open={Boolean(learnMore)}
        onClose={() => setLearnMore(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        {learnMore && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              Connect {learnMore.name}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                {learnMore.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                This integration is coming soon. We'll notify you when it's available.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setLearnMore(null)} sx={{ textTransform: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
