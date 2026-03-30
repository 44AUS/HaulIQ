import React from 'react';
import { Box } from '@mui/material';

const BRAND_MED = '#1976d2';

export default function WaveBg() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: BRAND_MED, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* Wave 1 — top, darkest */}
        <path
          fill="rgba(0,0,0,0.20)"
          d="M0,85 C240,45 480,125 720,85 C960,45 1200,120 1440,80 L1440,900 L0,900 Z"
        />
        {/* Wave 2 */}
        <path
          fill="rgba(0,0,0,0.16)"
          d="M0,205 C300,160 600,250 900,205 C1100,175 1300,235 1440,195 L1440,900 L0,900 Z"
        />
        {/* Wave 3 */}
        <path
          fill="rgba(0,0,0,0.11)"
          d="M0,330 C180,290 360,370 540,330 C720,290 900,368 1080,330 C1260,292 1380,355 1440,335 L1440,900 L0,900 Z"
        />
        {/* Wave 4 — middle */}
        <path
          fill="rgba(0,0,0,0.06)"
          d="M0,460 C360,415 720,505 1080,460 C1260,438 1380,482 1440,465 L1440,900 L0,900 Z"
        />
        {/* Wave 5 */}
        <path
          fill="rgba(255,255,255,0.05)"
          d="M0,590 C240,550 480,630 720,590 C960,550 1200,625 1440,585 L1440,900 L0,900 Z"
        />
        {/* Wave 6 */}
        <path
          fill="rgba(255,255,255,0.10)"
          d="M0,715 C300,685 600,748 900,715 C1100,698 1300,735 1440,720 L1440,900 L0,900 Z"
        />
        {/* Wave 7 — bottom, lightest */}
        <path
          fill="rgba(255,255,255,0.17)"
          d="M0,825 C360,805 720,848 1080,825 C1260,814 1380,838 1440,830 L1440,900 L0,900 Z"
        />
      </svg>
    </Box>
  );
}
