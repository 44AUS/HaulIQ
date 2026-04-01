import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

function extractHash(html) {
  const m = html.match(/src="\/static\/js\/main\.([a-f0-9]+)\.js"/);
  return m ? m[1] : null;
}

export default function UpdateNotifier() {
  const [visible, setVisible] = useState(false);
  const hashRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/?t=' + Date.now(), { cache: 'no-store' });
        const html = await r.text();
        const hash = extractHash(html);
        if (!hash) return;
        if (hashRef.current === null) {
          hashRef.current = hash;
        } else if (hash !== hashRef.current) {
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
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: { xs: '100%', sm: 480 },
        borderTop: '3px solid #f97316',
        bgcolor: '#fff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.25,
        gap: 1.5,
      }}
    >
      <IconButton size="small" onClick={() => setVisible(false)} sx={{ color: 'text.secondary', flexShrink: 0 }}>
        <CloseIcon fontSize="small" />
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
