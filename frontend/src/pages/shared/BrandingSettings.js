import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import { authApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const PRESET_COLORS = [
  '#0D1B2A', '#1565C0', '#1B5E20', '#4A148C',
  '#B71C1C', '#E65100', '#F57F17', '#006064',
  '#212121', '#263238', '#37474F', '#455A64',
  '#880E4F', '#1A237E', '#004D40', '#BF360C',
];

const DEFAULT_COLOR = '#1565C0';

function SectionHeader({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 24px', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ion-color-medium)', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}

export default function BrandingSettings({ embedded = false }) {
  const navigate = useNavigate();
  const { brandColor, setBrandColor } = useThemeMode();
  const currentColor = brandColor || DEFAULT_COLOR;

  const persistColor = (color) => {
    setBrandColor(color || null);
    authApi.update({ brand_color: color || null }).catch(() => {});
  };

  const handleReset = () => persistColor(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 8, width: '100%', maxWidth: 1200, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', flexShrink: 0 }}>
          {!embedded && (
            <button onClick={() => navigate('/preferences')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}>
              <IonIcon name="arrow-back-outline" style={{ fontSize: 18 }} />
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>Branding</span>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          <SectionHeader label="DESIGN ELEMENTS" />

          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--ion-background-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IonIcon name="color-palette-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Logo / Icon</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Coming soon</span>
            <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
          </div>

          {/* Primary color row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: currentColor, border: '2px solid var(--ion-border-color)', flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
              <input type="color" value={currentColor} onChange={e => persistColor(e.target.value)} style={{ position: 'absolute', inset: 0, width: '200%', height: '200%', opacity: 0, cursor: 'pointer', border: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Primary Color</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Navigation bar color</div>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--ion-color-medium)' }}>{currentColor.toUpperCase()}</span>
          </div>

          <SectionHeader label="COLOR PICKER" />

          {/* Picker + presets */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: currentColor, border: '2px solid var(--ion-border-color)', flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <input type="color" value={currentColor} onChange={e => persistColor(e.target.value)} style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', opacity: 0, cursor: 'pointer', border: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 4 }}>Pick any color</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Click the swatch to open the color picker — changes apply instantly</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--ion-color-medium)', marginTop: 4 }}>{currentColor.toUpperCase()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESET_COLORS.map(color => (
                <div
                  key={color}
                  title={color}
                  onClick={() => persistColor(color)}
                  style={{
                    width: 32, height: 32, borderRadius: 6, backgroundColor: color, cursor: 'pointer',
                    border: `2px solid ${currentColor === color ? 'var(--ion-color-primary)' : 'transparent'}`,
                    outline: currentColor === color ? '2px solid var(--ion-color-primary)' : 'none',
                    outlineOffset: 1,
                    transition: 'transform 0.1s',
                  }}
                />
              ))}
            </div>
          </div>

          <SectionHeader label="LIVE PREVIEW" />

          {/* Preview */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
            <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid var(--ion-border-color)', display: 'flex', height: 56 }}>
              <div style={{ backgroundColor: currentColor, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, minWidth: 180 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ width: 28, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--ion-background-color)', padding: 12, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                <div style={{ width: '55%', height: 5, borderRadius: 3, backgroundColor: 'var(--ion-color-light)' }} />
                <div style={{ width: '35%', height: 5, borderRadius: 3, backgroundColor: 'var(--ion-color-light)' }} />
              </div>
            </div>
          </div>

          {/* Reset row */}
          <div style={{ padding: '14px 24px' }}>
            <button
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}
            >
              <IonIcon name="reload-outline" style={{ fontSize: 16 }} />
              Reset to Default
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginTop: 10, marginBottom: 0 }}>
              Changes apply instantly to the navigation bar and are saved to your account.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
