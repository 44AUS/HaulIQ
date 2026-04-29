import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandingSettings from './BrandingSettings';
import Equipment from '../carrier/Equipment';
import IonIcon from '../../components/IonIcon';

const CARDS = [
  { key: 'branding',      icon: 'color-palette-outline',    title: 'Branding',       desc: 'Customize your navigation bar color and visual identity.',   available: true },
  { key: 'notifications', icon: 'notifications-outline',    title: 'Notifications',  desc: 'Control which email and push alerts you receive.',          available: false },
  { key: 'equipment',     icon: 'car-sport-outline',        title: 'Equipment',      desc: 'Add and manage your trucks, trailers, and load capacity.',  available: true, carrierOnly: true },
  { key: 'documents',     icon: 'document-text-outline',    title: 'Documents',      desc: 'Upload your CDL, MC authority, insurance, and more.',       available: false },
  { key: 'billing',       icon: 'card-outline',             title: 'Billing',        desc: 'Manage your subscription plan and payment method.',         available: false },
  { key: 'privacy',       icon: 'shield-checkmark-outline', title: 'Privacy',        desc: 'Control your data sharing and profile visibility.',        available: false },
  { key: 'security',      icon: 'lock-closed-outline',      title: 'Security',       desc: 'Manage trusted devices and login activity.',                available: false },
  { key: 'support',       icon: 'headset-outline',          title: 'Support',        desc: 'Get help, submit a ticket, or browse the help center.',    available: false },
];

function ComingSoon({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <IonIcon name="options-outline" style={{ fontSize: 44, color: 'var(--ion-color-medium)' }} />
      <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-color-medium)' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium-shade)' }}>Coming soon</span>
    </div>
  );
}

function AllCards({ user, onSelect }) {
  const cards = CARDS.filter(c => !c.carrierOnly || user?.role === 'carrier');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {cards.map(card => (
        <div
          key={card.key}
          onClick={card.available ? () => onSelect(card.key) : undefined}
          style={{
            backgroundColor: 'var(--ion-card-background)',
            border: '1px solid var(--ion-border-color)',
            borderRadius: 8,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            opacity: card.available ? 1 : 0.55,
            cursor: card.available ? 'pointer' : 'default',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <IonIcon name={card.icon} style={{ fontSize: 22, color: card.available ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: card.available ? 'var(--ion-text-color)' : 'var(--ion-color-medium)' }}>{card.title}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ion-color-medium)', lineHeight: 1.5, flex: 1 }}>{card.desc}</p>
          {!card.available && (
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium-shade)', marginTop: 12 }}>Coming soon</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Preferences() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const activeTab = searchParams.get('tab') || 'all';

  const goToTab = (key) => setSearchParams({ tab: key }, { replace: true });

  return (
    <div style={{ height: '100%' }}>
      {activeTab === 'all'           && <AllCards user={user} onSelect={goToTab} />}
      {activeTab === 'branding'      && <BrandingSettings embedded />}
      {activeTab === 'equipment'     && user?.role === 'carrier' && <Equipment />}
      {activeTab === 'equipment'     && user?.role !== 'carrier' && <ComingSoon label="Equipment" />}
      {activeTab === 'notifications' && <ComingSoon label="Notifications" />}
      {activeTab === 'documents'     && <ComingSoon label="Documents" />}
      {activeTab === 'billing'       && <ComingSoon label="Billing" />}
      {activeTab === 'privacy'       && <ComingSoon label="Privacy" />}
      {activeTab === 'security'      && <ComingSoon label="Security" />}
      {activeTab === 'support'       && <ComingSoon label="Support" />}
    </div>
  );
}
