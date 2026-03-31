import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, IconButton, Button,
  Divider, Paper, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PaletteIcon from '@mui/icons-material/Palette';
import { useThemeMode } from '../../context/ThemeContext';
import { authApi } from '../../services/api';

const PRESET_COLORS = [
  '#0D1B2A', '#1565C0', '#1B5E20', '#4A148C',
  '#B71C1C', '#E65100', '#F57F17', '#006064',
  '#212121', '#263238', '#37474F', '#455A64',
  '#880E4F', '#1A237E', '#004D40', '#BF360C',
];

const DEFAULT_COLOR = '#1565C0';

export default function BrandingSettings() {
  const navigate = useNavigate();
  const { brandColor, setBrandColor } = useThemeMode();
  const currentColor = brandColor || DEFAULT_COLOR;

  const persistColor = (color) => {
    setBrandColor(color || null);
    authApi.update({ brand_color: color || null }).catch(() => {});
  };

  const handleReset = () => persistColor(null);

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* Back header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={() => navigate('/preferences')}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>Branding</Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, mb: 1, display: 'block' }}>
        Design Elements
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        {/* Logo/Icon row (mock) */}
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important', cursor: 'default' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PaletteIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
          </Box>
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>Logo / Icon</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.disabled">Coming soon</Typography>
            <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
          </Box>
        </CardContent>

        <Divider />

        {/* Primary Color row */}
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important' }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '50%', bgcolor: currentColor,
              border: '2px solid', borderColor: 'divider', flexShrink: 0,
              overflow: 'hidden', position: 'relative', cursor: 'pointer',
            }}
          >
            <input
              type="color"
              value={currentColor}
              onChange={e => persistColor(e.target.value)}
              style={{ position: 'absolute', inset: 0, width: '200%', height: '200%', opacity: 0, cursor: 'pointer', border: 'none' }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>Primary Color</Typography>
            <Typography variant="caption" color="text.secondary">Navigation bar color</Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', mr: 1 }}>
            {currentColor.toUpperCase()}
          </Typography>
        </CardContent>
      </Card>

      {/* Color picker + presets */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Color Picker</Typography>

          {/* Full color picker */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: 2, bgcolor: currentColor,
                border: '2px solid', borderColor: 'divider', flexShrink: 0,
                overflow: 'hidden', position: 'relative', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <input
                type="color"
                value={currentColor}
                onChange={e => persistColor(e.target.value)}
                style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', opacity: 0, cursor: 'pointer', border: 'none' }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Pick any color</Typography>
              <Typography variant="caption" color="text.secondary">
                Click the swatch to open the color picker — changes apply instantly
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block" sx={{ fontFamily: 'monospace', mt: 0.5, fontSize: '0.8rem' }}>
                {currentColor.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          {/* Preset swatches */}
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Presets
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {PRESET_COLORS.map(color => (
              <Tooltip key={color} title={color} placement="top">
                <Box
                  onClick={() => persistColor(color)}
                  sx={{
                    width: 32, height: 32, borderRadius: 1.5, bgcolor: color, cursor: 'pointer',
                    border: '2px solid',
                    borderColor: currentColor === color ? 'primary.main' : 'transparent',
                    outline: currentColor === color ? '2px solid' : 'none',
                    outlineColor: 'primary.main',
                    outlineOffset: 1,
                    transition: 'transform 0.1s',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              </Tooltip>
            ))}
          </Box>

          {/* Live preview */}
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Live Preview
          </Typography>
          <Paper
            variant="outlined"
            sx={{ overflow: 'hidden', borderRadius: 2, display: 'flex', height: 56 }}
          >
            <Box sx={{ bgcolor: currentColor, display: 'flex', alignItems: 'center', px: 1.5, gap: 1, minWidth: 180 }}>
              {[1, 2, 3, 4].map(i => (
                <Box key={i} sx={{ width: 28, height: 6, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.35)' }} />
              ))}
            </Box>
            <Box sx={{ flex: 1, bgcolor: 'background.default', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75, justifyContent: 'center' }}>
              <Box sx={{ width: '55%', height: 5, borderRadius: 1, bgcolor: 'action.hover' }} />
              <Box sx={{ width: '35%', height: 5, borderRadius: 1, bgcolor: 'action.hover' }} />
            </Box>
          </Paper>
        </CardContent>
      </Card>

      {/* Reset */}
      <Button
        variant="outlined"
        startIcon={<RestartAltIcon />}
        onClick={handleReset}
        color="inherit"
      >
        Reset to Default
      </Button>

      <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 2 }}>
        Changes apply instantly to the navigation bar and are saved in your browser.
      </Typography>
    </Box>
  );
}
