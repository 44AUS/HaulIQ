import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IonSkeletonText, IonRippleEffect,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
} from '@ionic/react';
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
  return (
    <div style={{ flex: 1, minWidth: 220, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ion-border-color)', position: 'relative', minHeight: 320 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: color }} />
      <img
        src="/map_vector.svg"
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.13, filter: 'brightness(0) invert(1)', pointerEvents: 'none' }}
      />
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
      <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{label}</span>
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
  const [colorModalOpen, setColorModalOpen] = useState(false);

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
      await authApi.update({ logo_url: dataUrl });
      updateUser({ logo_url: dataUrl });
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
          <SectionHeader label="Design Elements" />

          {/* Logo row */}
          <div className="ion-activatable" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <IonRippleEffect />
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--ion-background-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {user?.logo_url
                ? <img src={user.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div className="ion-activatable" onClick={() => setColorModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--ion-border-color)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <IonRippleEffect />
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: currentColor, border: '2px solid var(--ion-border-color)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Primary Color</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Navigation bar color</div>
            </div>
            <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
          </div>

          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ion-border-color)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <MobileAppPreview color={currentColor} />
            <BusinessCardPreview color={currentColor} logoUrl={user?.logo_url} onLogoClick={handleLogoClick} />
          </div>

        </div>
      </div>

      <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoFile} />

      <style>{`
        .brand-color-modal { --border-radius: 0px; }
        @media (min-width: 768px) {
          .brand-color-modal { --width: 420px; --max-height: 90vh; }
        }
      `}</style>
      <IonModal isOpen={colorModalOpen} onDidDismiss={() => setColorModalOpen(false)} className="brand-color-modal">
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)', '--color': 'var(--ion-text-color)' }}>
            <IonButtons slot="start">
              <IonButton fill="clear" shape="round" onClick={() => setColorModalOpen(false)}>
                <IonIcon slot="icon-only" name="close-outline" />
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>Primary Color</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" shape="round" onClick={() => setColorModalOpen(false)} style={{ '--color': 'var(--ion-color-success)' }}>
                <IonIcon slot="icon-only" name="checkmark-outline" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '20px 20px 8px' }}>
            <input
              type="color"
              value={currentColor}
              onChange={e => persistColor(e.target.value)}
              style={{ display: 'block', width: '100%', height: 200, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '10px 14px', backgroundColor: 'var(--ion-background-color)', borderRadius: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: currentColor, border: '1px solid var(--ion-border-color)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--ion-text-color)', fontWeight: 600 }}>{currentColor.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 10 }}>Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PRESET_COLORS.map(color => (
                <div
                  key={color}
                  title={color}
                  onClick={() => persistColor(color)}
                  className="ion-activatable"
                  style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: color, cursor: 'pointer', position: 'relative', overflow: 'hidden', border: `2px solid ${currentColor === color ? '#fff' : 'transparent'}`, outline: currentColor === color ? `2px solid ${color}` : 'none', outlineOffset: 2 }}
                >
                  <IonRippleEffect />
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px 20px' }}>
            <div
              onClick={() => { handleReset(); }}
              className="ion-activatable"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--ion-border-color)', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', color: 'var(--ion-text-color)', fontWeight: 600, fontSize: '0.875rem', position: 'relative', overflow: 'hidden' }}
            >
              <IonRippleEffect />
              <IonIcon name="reload-outline" style={{ fontSize: 16 }} />
              Reset to Default
            </div>
          </div>
        </IonContent>
      </IonModal>
    </div>
  );
}
