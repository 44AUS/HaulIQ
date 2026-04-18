import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import IonIcon from './IonIcon';


const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchVersion() {
  // HEAD request to index.html — Vercel sets a unique ETag per deployment
  // and explicitly does NOT CDN-cache index.html, so this is always fresh.
  const r = await fetch('/', {
    method: 'HEAD',
    cache: 'no-store',
    headers: { 'pragma': 'no-cache', 'cache-control': 'no-cache' },
  });
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
        if (versionRef.current === null) {
          versionRef.current = version;
        } else if (version !== versionRef.current) {
          setVisible(true);
        }
      } catch {}
    };

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: { xs: 'calc(100% - 32px)', sm: 640 },
        borderTop: '3px solid #f97316',
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.25,
        gap: 1.5,
      }}
    >
      <IconButton size="small" onClick={() => setVisible(false)} sx={{ color: 'text.secondary', flexShrink: 0 }}>
        <IonIcon name="close-outline" fontSize="small" />
      </IconButton>
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, color: 'text.primary' }}>
        New version available!
      </Typography>
      <Button
        size="small"
        onClick={() => window.location.reload()}
        sx={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.06em', color: 'text.primary', flexShrink: 0 }}
      >
        REFRESH
      </Button>
    </Box>
  );
}
