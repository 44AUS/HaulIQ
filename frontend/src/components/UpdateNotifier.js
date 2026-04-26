import { useState, useEffect, useRef } from 'react';
import IonIcon from './IonIcon';

const POLL_INTERVAL = 5 * 60 * 1000;

async function fetchVersion() {
  const r = await fetch('/', { method: 'HEAD', cache: 'no-store', headers: { 'pragma': 'no-cache', 'cache-control': 'no-cache' } });
  if (!r.ok) return null;
  return r.headers.get('etag') || r.headers.get('last-modified') || null;
}

export default function UpdateNotifier() {
  const [visible, setVisible] = useState(false);
  const versionRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const version = await fetchVersion();
        if (!version) return;
        if (versionRef.current === null) { versionRef.current = version; }
        else if (version !== versionRef.current) { setVisible(true); }
      } catch {}
    };
    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'min(calc(100% - 32px), 640px)',
      borderRadius: 8,
      backgroundColor: 'var(--ion-card-background)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12,
    }}>
      <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', flexShrink: 0, display: 'flex', alignItems: 'center', padding: 4 }}>
        <IonIcon name="close-outline" fontSize="small" />
      </button>
      <span style={{ flex: 1, fontWeight: 500, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>
        New version available!
      </span>
      <button
        onClick={() => window.location.reload()}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.06em', color: 'var(--ion-text-color)', flexShrink: 0 }}
      >
        REFRESH
      </button>
    </div>
  );
}
