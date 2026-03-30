import React from 'react';
import { Box } from '@mui/material';

const BRAND_MED = '#1976d2';

// 7 waves — dark overlays at the top, fading to soft white at the bottom
const WAVES = [
  {
    fill: 'rgba(0,0,0,0.22)',
    h: 360,
    d: 'M0,180 C200,120 400,240 600,180 C800,120 1000,240 1200,180 C1320,150 1400,195 1440,170 L1440,360 L0,360 Z',
  },
  {
    fill: 'rgba(0,0,0,0.17)',
    h: 310,
    d: 'M0,155 C240,95 480,215 720,155 C900,110 1100,200 1300,140 C1380,115 1420,160 1440,145 L1440,310 L0,310 Z',
  },
  {
    fill: 'rgba(0,0,0,0.12)',
    h: 260,
    d: 'M0,130 C160,180 320,80 480,130 C640,180 800,80 960,130 C1120,180 1300,95 1440,120 L1440,260 L0,260 Z',
  },
  {
    fill: 'rgba(0,0,0,0.07)',
    h: 210,
    d: 'M0,105 C300,55 600,155 900,105 C1100,70 1280,135 1440,95 L1440,210 L0,210 Z',
  },
  {
    fill: 'rgba(255,255,255,0.06)',
    h: 160,
    d: 'M0,80 C180,120 360,40 540,80 C720,120 900,40 1080,80 C1260,120 1380,55 1440,70 L1440,160 L0,160 Z',
  },
  {
    fill: 'rgba(255,255,255,0.11)',
    h: 110,
    d: 'M0,55 C240,15 480,95 720,55 C960,15 1200,90 1440,45 L1440,110 L0,110 Z',
  },
  {
    fill: 'rgba(255,255,255,0.18)',
    h: 60,
    d: 'M0,30 C360,55 720,5 1080,30 C1260,42 1380,18 1440,25 L1440,60 L0,60 Z',
  },
];

export default function WaveBg() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: BRAND_MED, overflow: 'hidden' }}>
      {/* Subtle radial glows for depth */}
      <Box sx={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', top: -200, right: -140, background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', bottom: -160, left: -110, background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* 7 wave layers */}
      {WAVES.map((w, i) => (
        <Box key={i} sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg
            viewBox={`0 0 1440 ${w.h}`}
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: w.h }}
          >
            <path fill={w.fill} d={w.d} />
          </svg>
        </Box>
      ))}
    </Box>
  );
}
