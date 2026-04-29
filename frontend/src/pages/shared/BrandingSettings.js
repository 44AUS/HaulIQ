import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonSkeletonText, IonRippleEffect } from '@ionic/react';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const PRESET_COLORS = [
  '#0D1B2A', '#1565C0', '#1B5E20', '#4A148C',
  '#B71C1C', '#E65100', '#F57F17', '#006064',
  '#212121', '#263238', '#37474F', '#455A64',
  '#880E4F', '#1A237E', '#004D40', '#BF360C',
];

const DEFAULT_COLOR = '#1565C0';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function blendWhite(hex, pct) {
  try {
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${Math.round(r + (255 - r) * pct)},${Math.round(g + (255 - g) * pct)},${Math.round(b + (255 - b) * pct)})`;
  } catch { return hex; }
}

function resizeImageToDataUrl(file, maxSize = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });
}

function MobileAppPreview({ color }) {
  const rows = ['call-outline', 'mail-outline', 'chatbox-outline'];
  return (
    <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, overflow: 'hidden', flex: 1, minWidth: 220 }}>
      <div style={{ backgroundColor: color, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <IonIcon name="chevron-back-outline" style={{ color: '#fff', fontSize: 20, flexShrink: 0 }} />
        <IonSkeletonText animated style={{ width: 100, height: 13, borderRadius: 4, flex: 'none', '--background': 'rgba(255,255,255,0.25)', '--background-rgb': '255,255,255' }} />
        <div style={{ flex: 1 }} />
        <IonIcon name="ellipsis-vertical-outline" style={{ color: '#fff', fontSize: 20, flexShrink: 0 }} />
      </div>
      <div style={{ backgroundColor: blendWhite(color, 0.15), display: 'flex' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 4px', borderBottom: i === 0 ? '2px solid #fff' : '2px solid transparent' }}>
            <IonSkeletonText animated style={{ width: 42, height: 10, borderRadius: 4, '--background': 'rgba(255,255,255,0.3)', '--background-rgb': '255,255,255' }} />
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: 'var(--ion-card-background)', margin: 8, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ion-border-color)' }}>
        {rows.map((icon, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderBottom: i < rows.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
            <IonIcon name={icon} style={{ color, fontSize: 20, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <IonSkeletonText animated style={{ width: '90%', height: 9, marginBottom: 5, borderRadius: 4 }} />
              <IonSkeletonText animated style={{ width: '65%', height: 9, marginBottom: 5, borderRadius: 4 }} />
              <IonSkeletonText animated style={{ width: '75%', height: 9, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: 'var(--ion-card-background)', margin: 8, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ion-border-color)' }}>
        <div style={{ display: 'flex' }}>
          {[{ icon: 'call-outline', active: true }, { icon: 'mail-outline' }, { icon: 'chatbox-outline' }].map(({ icon, active }, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', borderBottom: `2px solid ${active ? color : 'transparent'}` }}>
              <IonIcon name={icon} style={{ fontSize: 16, color: active ? color : 'var(--ion-color-medium)', marginBottom: 4 }} />
              <IonSkeletonText animated style={{ width: 40, height: 9, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ backgroundColor: 'var(--ion-card-background)', margin: 8, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ion-border-color)' }}>
        {rows.map((icon, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderBottom: i < rows.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <IonSkeletonText animated style={{ width: '90%', height: 9, marginBottom: 5, borderRadius: 4 }} />
              <IonSkeletonText animated style={{ width: '65%', height: 9, marginBottom: 5, borderRadius: 4 }} />
              <IonSkeletonText animated style={{ width: '75%', height: 9, borderRadius: 4 }} />
            </div>
            <IonIcon name={icon} style={{ color, fontSize: 20, flexShrink: 0, marginTop: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessCardPreview({ color, logoUrl, onLogoClick }) {
  const steps = [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48, 0.56, 0.64, 0.72].map(p => blendWhite(color, p));
  return (
    <div style={{ flex: 1, minWidth: 220, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ion-border-color)', position: 'relative', minHeight: 320 }}>
      <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1600 800"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="1600" height="800" fill={steps[0]} />
        <g>
          <path d="M486 705.8c-109.3-21.8-223.4-32.2-335.3-19.4C99.5 692.1 49 703 0 719.8V800h843.8c-115.9-33.2-230.8-68.1-347.6-92.2C492.8 707.1 489.4 706.5 486 705.8z" fill={steps[0]} />
          <path d="M1600 0H0v719.8c49-16.8 99.5-27.8 150.7-33.5c111.9-12.7 226-2.4 335.3 19.4c3.4 0.7 6.8 1.4 10.2 2c116.8 24 231.7 59 347.6 92.2H1600V0z" fill={steps[1]} />
          <path d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2 478.4 581z" fill={steps[2]} />
          <path d="M0 0v429.4c55.6-18.4 113.5-27.3 171.4-27.7c102.8-0.8 203.2 22.7 299.3 54.5c3 1 5.9 2 8.9 3c183.6 62 365.7 146.1 562.4 192.1c186.7 43.7 376.3 34.4 557.9-12.6V0H0z" fill={steps[3]} />
          <path d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z" fill={steps[4]} />
          <path d="M1600 0H0v136.3c62.3-20.9 127.7-27.5 192.2-19.2c93.6 12.1 180.5 47.7 263.3 89.6c2.6 1.3 5.1 2.6 7.7 3.9c158.4 81.1 319.7 170.9 500.3 223.2c210.5 61 430.8 49 636.6-16.6V0z" fill={steps[5]} />
          <path d="M454.9 86.3C600.7 177 751.6 269.3 924.1 325c208.6 67.4 431.3 60.8 637.9-5.3c12.8-4.1 25.4-8.4 38.1-12.9V0H288.1c56 21.3 108.7 50.6 159.7 82C450.2 83.4 452.5 84.9 454.9 86.3z" fill={steps[6]} />
          <path d="M1600 0H498c118.1 85.8 243.5 164.5 386.8 216.2c191.8 69.2 400 74.7 595 21.1c40.8-11.2 81.1-25.2 120.3-41.7V0z" fill={steps[7]} />
          <path d="M1397.5 154.8c47.2-10.6 93.6-25.3 138.6-43.8c21.7-8.9 43-18.8 63.9-29.5V0H643.4c62.9 41.7 129.7 78.2 202.1 107.4C1020.4 178.1 1214.2 196.1 1397.5 154.8z" fill={steps[8]} />
          <path d="M1315.3 72.4c75.3-12.6 148.9-37.1 216.8-72.4h-723C966.8 71 1144.7 101 1315.3 72.4z" fill={steps[9]} />
        </g>
      </svg>
      <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 12, padding: '20px 20px 16px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
          {/* Clickable logo */}
          <div
            onClick={onLogoClick}
            className="ion-activatable"
            title="Click to change logo"
            style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--ion-color-light)', margin: '0 auto 14px', border: '2px solid var(--ion-border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', flexShrink: 0 }}
          >
            <IonRippleEffect />
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <>
                  <IonIcon name="business-outline" style={{ fontSize: 28, color: 'var(--ion-color-medium)' }} />
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonIcon name="camera-outline" style={{ fontSize: 10, color: '#fff' }} />
                  </div>
                </>
            }
          </div>
          <IonSkeletonText animated style={{ width: '65%', height: 11, borderRadius: 4, margin: '0 auto 6px' }} />
          <IonSkeletonText animated style={{ width: '50%', height: 9, borderRadius: 4, margin: '0 auto 14px' }} />
          {[90, 65, 75, 80].map((w, i) => (
            <IonSkeletonText key={i} animated style={{ width: `${w}%`, height: 9, borderRadius: 4, marginBottom: 6 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const { user, updateUser } = useAuth();
  const currentColor = brandColor || DEFAULT_COLOR;
  const logoInputRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const persistColor = (color) => {
    setBrandColor(color || null);
    authApi.update({ brand_color: color || null }).catch(() => {});
  };

  const handleReset = () => persistColor(null);

  const handleLogoClick = () => logoInputRef.current?.click();

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLogoUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      await authApi.update({ avatar_url: dataUrl });
      updateUser({ avatar_url: dataUrl });
    } catch {}
    finally { setLogoUploading(false); }
  };

  return (
    <div style={{ padding: 10, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--ion-card-background)', borderRadius: 8, width: '100%', maxWidth: 1200, margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
          {!embedded && (
            <button onClick={() => navigate('/preferences')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4 }}>
              <IonIcon name="arrow-back-outline" style={{ fontSize: 18 }} />
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>Branding</span>
        </div>

        <div>
          <SectionHeader label="DESIGN ELEMENTS" />

          {/* Logo row */}
          <div className="ion-activatable" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <IonRippleEffect />
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--ion-background-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <IonIcon name="color-palette-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Logo / Icon</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{logoUploading ? 'Uploading…' : 'Tap to upload your business logo'}</div>
            </div>
            <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
          </div>

          {/* Primary color row */}
          <div className="ion-activatable" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <IonRippleEffect />
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
                  className="ion-activatable"
                  style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: color, cursor: 'pointer', position: 'relative', overflow: 'hidden', border: `2px solid ${currentColor === color ? 'var(--ion-color-primary)' : 'transparent'}`, outline: currentColor === color ? '2px solid var(--ion-color-primary)' : 'none', outlineOffset: 1 }}
                >
                  <IonRippleEffect />
                </div>
              ))}
            </div>
          </div>

          <SectionHeader label="LIVE PREVIEW" />

          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ion-border-color)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <MobileAppPreview color={currentColor} />
            <BusinessCardPreview color={currentColor} logoUrl={user?.avatar_url} onLogoClick={handleLogoClick} />
          </div>

          <div style={{ padding: '14px 24px' }}>
            <div
              onClick={handleReset}
              className="ion-activatable"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontWeight: 600, fontSize: '0.875rem', position: 'relative', overflow: 'hidden' }}
            >
              <IonRippleEffect />
              <IonIcon name="reload-outline" style={{ fontSize: 16 }} />
              Reset to Default
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', marginTop: 10, marginBottom: 0 }}>
              Changes apply instantly to the navigation bar and are saved to your account.
            </p>
          </div>
        </div>
      </div>

      <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoFile} />
    </div>
  );
}
