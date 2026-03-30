import React from 'react';
import { Box, IconButton, Select, MenuItem } from '@mui/material';
import NightlightIcon from '@mui/icons-material/Nightlight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

export default function AuthHeader({ lang, setLang, mode, toggleMode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
      <Box
        component="img"
        src="/urload-logo.png"
        alt="Urload"
        sx={{ height: 28, filter: 'brightness(0) invert(1)' }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Select
          value={lang}
          onChange={e => setLang(e.target.value)}
          size="small"
          sx={{
            height: 32,
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.78rem',
            fontWeight: 600,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.45)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.45)' },
            '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' },
            '& .MuiSelect-select': { py: 0, px: 1.25, lineHeight: '32px' },
          }}
        >
          <MenuItem value="en" sx={{ fontSize: '0.82rem' }}>English</MenuItem>
          <MenuItem value="es" sx={{ fontSize: '0.82rem' }}>Español</MenuItem>
          <MenuItem value="fr" sx={{ fontSize: '0.82rem' }}>Français</MenuItem>
        </Select>

        <IconButton
          onClick={toggleMode}
          size="small"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            width: 32, height: 32,
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.45)' },
          }}
        >
          {mode === 'dark'
            ? <NightlightIcon sx={{ fontSize: 16 }} />
            : <WbSunnyIcon sx={{ fontSize: 16 }} />
          }
        </IconButton>
      </Box>
    </Box>
  );
}
