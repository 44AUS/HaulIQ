import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, IconButton, Button,
  Divider, Paper, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PaletteIcon from '@mui/icons-material/Palette';
import { useThemeMode } from '../../context/ThemeContext';

const PRESET_COLORS = [
  '#0D1B2A', '#1565C0', '#1B5E20', '#4A148C',
  '#B71C1C', '#E65100', '#F57F17', '#006064',
  '#212121', '#263238', '#37474F', '#455A64',
  '#880E4F', '#1A237E', '#004D40', '#BF360C',
];

const DEFAULT_COLOR = '#0D1B2A';

export default function BrandingSettings() {
  const navigate = useNavigate();
  const { brandColor, setBrandColor } = useThemeMode();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tempColor, setTempColor] = useState(brandColor || DEFAULT_COLOR);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setBrandColor(tempColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setBrandColor(null);
    setTempColor(DEFAULT_COLOR);
  };

  const currentColor = brandColor || DEFAULT_COLOR;

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* Back header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={() => navigate('/settings')}>
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
        <CardContent
          sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          onClick={() => setPickerOpen(v => !v)}
        >
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: currentColor, border: '2px solid', borderColor: 'divider', flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>Primary Color</Typography>
          <ChevronRightIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
        </CardContent>
      </Card>

      {/* Color picker panel */}
      {pickerOpen && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Navigation Bar Color</Typography>

            {/* Native color picker */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: 2, bgcolor: tempColor,
                  border: '2px solid', borderColor: 'divider', flexShrink: 0,
                  overflow: 'hidden', position: 'relative', cursor: 'pointer',
                }}
              >
                <input
                  type="color"
                  value={tempColor}
                  onChange={e => setTempColor(e.target.value)}
                  style={{
                    position: 'absolute', inset: 0, width: '200%', height: '200%',
                    opacity: 0, cursor: 'pointer', border: 'none',
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Custom color</Typography>
                <Typography variant="caption" color="text.secondary">
                  Click the swatch to open the color picker
                </Typography>
                <Typography variant="caption" color="text.disabled" display="block" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {tempColor}
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
                    onClick={() => setTempColor(color)}
                    sx={{
                      width: 32, height: 32, borderRadius: 1.5, bgcolor: color, cursor: 'pointer',
                      border: '2px solid', borderColor: tempColor === color ? 'primary.main' : 'transparent',
                      outline: tempColor === color ? '2px solid' : 'none',
                      outlineColor: 'primary.main',
                      outlineOffset: 1,
                      transition: 'transform 0.1s',
                      '&:hover': { transform: 'scale(1.15)' },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>

            {/* Preview */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Preview
            </Typography>
            <Paper
              variant="outlined"
              sx={{ overflow: 'hidden', borderRadius: 2, mb: 2.5, display: 'flex', height: 80 }}
            >
              {/* Sidebar preview strip */}
              <Box sx={{ width: 40, bgcolor: tempColor, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, gap: 1 }}>
                {[1, 2, 3, 4].map(i => (
                  <Box key={i} sx={{ width: 20, height: 4, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                ))}
              </Box>
              {/* Content area preview */}
              <Box sx={{ flex: 1, bgcolor: 'background.default', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ width: '60%', height: 6, borderRadius: 1, bgcolor: 'action.hover' }} />
                <Box sx={{ width: '40%', height: 6, borderRadius: 1, bgcolor: 'action.hover' }} />
                <Box sx={{ width: '75%', height: 6, borderRadius: 1, bgcolor: 'action.hover' }} />
              </Box>
            </Paper>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={saved ? <CheckIcon /> : null}
                onClick={handleSave}
                color={saved ? 'success' : 'primary'}
                sx={{ flex: 1 }}
              >
                {saved ? 'Saved!' : 'Apply Color'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                color="inherit"
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      <Typography variant="caption" color="text.disabled">
        The primary color is applied to the navigation bar. Changes are saved locally in your browser.
      </Typography>
    </Box>
  );
}
