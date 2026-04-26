import { useState } from 'react';
import { IonModal } from '@ionic/react';
import { useThemeMode } from '../../context/ThemeContext';
import IonIcon from '../../components/IonIcon';

const INTEGRATIONS = [
  { key: 'quickbooks',  name: 'QuickBooks',           category: 'Accounting',   description: 'Sync invoices, payments, and expenses directly with QuickBooks Online.', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/QuickBooks_logo.svg/512px-QuickBooks_logo.svg.png', color: '#2CA01C', available: false },
  { key: 'samsara',     name: 'Samsara',               category: 'Fleet & ELD',  description: 'Pull live vehicle locations, HOS logs, and driver data from Samsara.', initials: 'SA', color: '#FF6B35', available: false },
  { key: 'motive',      name: 'Motive (KeepTruckin)',  category: 'Fleet & ELD',  description: 'Sync ELD logs, IFTA reports, and driver hours from Motive.', initials: 'MO', color: '#0071CE', available: false },
  { key: 'dat',         name: 'DAT Load Board',        category: 'Load Boards',  description: 'Import and sync loads directly from your DAT account.', initials: 'DAT', color: '#E63946', available: false },
  { key: 'truckstop',   name: 'Truckstop.com',         category: 'Load Boards',  description: 'Automatically pull available loads from Truckstop into HaulIQ.', initials: 'TS', color: '#1D3557', available: false },
  { key: 'stripe',      name: 'Stripe',                category: 'Payments',     description: 'Already connected — HaulIQ uses Stripe to process all payments and payouts.', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png', color: '#635BFF', available: true, connected: true, managed: true },
  { key: 'twilio',      name: 'Twilio',                category: 'Messaging',    description: 'Send automated SMS notifications to drivers and brokers via Twilio.', initials: 'TW', color: '#F22F46', available: false },
  { key: 'google_maps', name: 'Google Maps',           category: 'Mapping',      description: 'Already connected — powers live tracking, route planning, and map views.', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/418px-Google_Maps_icon_%282020%29.svg.png', color: '#4285F4', available: true, connected: true, managed: true },
  { key: 'mcleod',      name: 'McLeod Software',       category: 'TMS',          description: 'Integrate with McLeod LoadMaster or PowerBroker for advanced TMS workflows.', initials: 'ML', color: '#2D6A4F', available: false },
  { key: 'relay',       name: 'Relay Payments',        category: 'Payments',     description: 'Accept fuel advances and lumper payments through the Relay network.', initials: 'RL', color: '#7B2D8B', available: false },
  { key: 'fourkites',   name: 'FourKites',             category: 'Tracking',     description: 'Real-time shipment visibility and predictive ETAs via FourKites.', initials: 'FK', color: '#0080FF', available: false },
  { key: 'project44',   name: 'project44',             category: 'Tracking',     description: 'Advanced visibility and analytics for your freight network.', initials: 'P44', color: '#FF4713', available: false },
];

const CATEGORIES = ['All', ...Array.from(new Set(INTEGRATIONS.map(i => i.category)))];

function IntegrationCard({ integration, onLearnMore }) {
  const { isDark } = useThemeMode();
  const borderColor = integration.connected
    ? (isDark ? 'rgba(45,211,111,0.4)' : 'rgba(45,211,111,0.6)')
    : 'var(--ion-border-color)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, border: `1px solid ${borderColor}`, backgroundColor: 'var(--ion-card-background)', padding: 20, opacity: integration.available ? 1 : 0.72, transition: 'all 0.15s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: integration.logo ? 'transparent' : integration.color, color: '#fff', fontSize: integration.initials?.length > 2 ? '0.65rem' : '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, overflow: 'hidden' }}>
          {integration.logo ? <img src={integration.logo} alt={integration.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : integration.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3, color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{integration.name}</div>
          <span style={{ display: 'inline-block', marginTop: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: 'var(--ion-color-medium)', borderRadius: 10, padding: '1px 8px', fontSize: '0.65rem', fontWeight: 600 }}>{integration.category}</span>
        </div>
        {integration.connected && <IonIcon name="checkmark-circle" style={{ fontSize: 18, color: '#2dd36f', flexShrink: 0, marginTop: 2 }} />}
      </div>

      {/* Description */}
      <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'var(--ion-color-medium)', lineHeight: 1.55, flex: 1, minHeight: 50 }}>{integration.description}</p>

      {/* Footer */}
      {integration.managed ? (
        <span style={{ backgroundColor: isDark ? 'rgba(45,211,111,0.12)' : 'rgba(45,211,111,0.1)', color: '#2dd36f', border: '1px solid rgba(45,211,111,0.25)', borderRadius: 10, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <IonIcon name="checkmark-circle" style={{ fontSize: 12 }} /> Managed by HaulIQ
        </span>
      ) : integration.available ? (
        <button onClick={() => onLearnMore(integration)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'none', border: '1px solid var(--ion-color-primary)', color: 'var(--ion-color-primary)', borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
          Connect <IonIcon name="open-outline" style={{ fontSize: 13 }} />
        </button>
      ) : (
        <span style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'var(--ion-color-medium)', borderRadius: 10, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600 }}>Coming Soon</span>
      )}
    </div>
  );
}

export default function Integrations() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [learnMore, setLearnMore] = useState(null);

  const filtered = INTEGRATIONS.filter(i => activeCategory === 'All' || i.category === activeCategory);
  const connected = INTEGRATIONS.filter(i => i.connected && !i.managed).length;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <IonIcon name="extension-puzzle-outline" style={{ fontSize: 28, color: 'var(--ion-color-primary)' }} />
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>Integrations</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          Connect HaulIQ with the tools you already use.
          {connected > 0 && ` ${connected} integration${connected > 1 ? 's' : ''} connected.`}
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ background: activeCategory === cat ? 'var(--ion-color-primary)' : 'transparent', color: activeCategory === cat ? '#fff' : 'var(--ion-text-color)', border: `1px solid ${activeCategory === cat ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 20, padding: '5px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--ion-border-color)', marginBottom: 24 }} />

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {filtered.map(integration => (
          <IntegrationCard key={integration.key} integration={integration} onLearnMore={setLearnMore} />
        ))}
      </div>

      {/* Learn more modal */}
      <IonModal isOpen={Boolean(learnMore)} onDidDismiss={() => setLearnMore(null)} style={{ '--width': '420px', '--height': 'auto', '--border-radius': '14px' }}>
        {learnMore && (
          <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 14 }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Connect {learnMore.name}</h3>
            <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{learnMore.description}</p>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>This integration is coming soon. We'll notify you when it's available.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setLearnMore(null)} style={{ background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontFamily: 'inherit' }}>Close</button>
            </div>
          </div>
        )}
      </IonModal>
    </div>
  );
}
