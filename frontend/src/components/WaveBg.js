import { Box } from '@mui/material';

// 7 solid-color wave bands stepping from dark → light blue.
// Each wave uses a proper full-period sine bezier (crest + trough) for visible waviness.
const WAVES = [
  { color: '#1769c5', y: 108, a: 82 },
  { color: '#1e80d8', y: 238, a: 80 },
  { color: '#2494e6', y: 366, a: 76 },
  { color: '#2fa8f2', y: 490, a: 72 },
  { color: '#47baf9', y: 610, a: 66 },
  { color: '#6ecbfc', y: 724, a: 58 },
  { color: '#9ddcfe', y: 828, a: 46 },
];

// Full sinusoidal wave via cubic bezier sine approximation:
// first half rises to crest, second half dips to trough — one full period across 1440px.
function wavePath(y, a) {
  return (
    `M0,${y} ` +
    `C252,${y - a} 468,${y - a} 720,${y} ` +
    `C972,${y + a} 1188,${y + a} 1440,${y} ` +
    `L1440,900 L0,900 Z`
  );
}

export default function WaveBg() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: '#1565c0', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      >
        {WAVES.map((w, i) => (
          <path key={i} fill={w.color} d={wavePath(w.y, w.a)} />
        ))}
      </svg>
    </Box>
  );
}
