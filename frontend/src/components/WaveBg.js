import React from 'react';
import { Box } from '@mui/material';

// Each wave is a progressively lighter tint of the brand blue,
// matching the layered wave style from the reference screenshot.
const WAVES = [
  { color: '#1976d2', d: 'M0,90 C480,25 960,190 1440,105 L1440,900 L0,900 Z' },
  { color: '#1e88e5', d: 'M0,235 C480,160 960,315 1440,240 L1440,900 L0,900 Z' },
  { color: '#2196f3', d: 'M0,375 C360,305 720,445 1080,375 C1260,340 1380,410 1440,375 L1440,900 L0,900 Z' },
  { color: '#42a5f5', d: 'M0,505 C480,435 960,575 1440,505 L1440,900 L0,900 Z' },
  { color: '#64b5f6', d: 'M0,635 C360,570 720,700 1080,635 C1260,603 1380,668 1440,640 L1440,900 L0,900 Z' },
  { color: '#90caf9', d: 'M0,755 C480,700 960,810 1440,755 L1440,900 L0,900 Z' },
  { color: '#bbdefb', d: 'M0,855 C360,830 720,875 1080,850 C1260,838 1380,865 1440,855 L1440,900 L0,900 Z' },
];

export default function WaveBg() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: '#1565c0', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {WAVES.map((w, i) => (
          <path key={i} fill={w.color} d={w.d} />
        ))}
      </svg>
    </Box>
  );
}
