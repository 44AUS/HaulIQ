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

export default function BrandingSettings({ embedded = false }) {
  const navigate = useNavigate();
  const { brandColor, setBrandColor } = useThemeMode();
  const currentColor = brandColor || DEFAULT_COLOR;

  const persistColor = (color) => {
    setBrandColor(color || null);
    authApi.update({ brand_color: color || null }).catch(() => {});
  };

  const handleReset = () => persistColor(null);

  const cardStyle = {
    backgroundColor: 'var(--ion-card-background)',
    border: '1px solid var(--ion-border-color)',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <button onClick={() => navigate('/preferences')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}>
            <IonIcon name="arrow-back-outline" style={{ fontSize: 20 }} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>Branding</h2>
        </div>
      )}

      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>
        Design Elements
      </div>

      <div style={cardStyle}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IonIcon name="color-palette-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
          </div>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Logo / Icon</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Coming soon</span>
            <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--ion-border-color)' }} />

        {/* Primary color row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: currentColor, border: '2px solid var(--ion-border-color)', flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
            <input type="color" value={currentColor} onChange={e => persistColor(e.target.value)} style={{ position: 'absolute', inset: 0, width: '200%', height: '200%', opacity: 0, cursor: 'pointer', border: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Primary Color</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Navigation bar color</div>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginRight: 4 }}>{currentColor.toUpperCase()}</span>
        </div>
      </div>

      {/* Color picker + presets */}
      <div style={cardStyle}>
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 16 }}>Color Picker</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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

          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Live Preview</div>
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
      </div>

      <button
        onClick={handleReset}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}
      >
        <IonIcon name="reload-outline" style={{ fontSize: 16 }} />
        Reset to Default
      </button>

      <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginTop: 12 }}>
        Changes apply instantly to the navigation bar and are saved in your browser.
      </p>
    </div>
  );
}
