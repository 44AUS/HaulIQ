import { Box } from '@mui/material';

// 7 solid-color wave bands, each filling from its curve edge down to the bottom.
// Colors step from dark blue → light blue, matching the layered ocean effect in the reference.
const WAVES = [
  { color: '#1769c5', y: 110, a: 68 },
  { color: '#1e80d8', y: 235, a: 68 },
  { color: '#2494e6', y: 358, a: 65 },
  { color: '#2fa8f2', y: 478, a: 62 },
  { color: '#47baf9', y: 595, a: 58 },
  { color: '#6ecbfc', y: 708, a: 52 },
  { color: '#9ddcfe', y: 818, a: 44 },
];

// Generates a smooth single-arc S-curve wave path that fills to the bottom of the SVG
function path(y, a) {
  return `M0,${y} C480,${y - a} 960,${y + a} 1440,${y} L1440,900 L0,900 Z`;
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
          <path key={i} fill={w.color} d={path(w.y, w.a)} />
        ))}
      </svg>
    </Box>
  );
}
